// Load required libraries
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var shortid = require('shortid'); // For creating short unique names to use in the temp directory
var express = require('express');
var request = require('request');
var cors = require('cors');
var tar = require('tar');
var app = express();
var helmet = require('helmet');
var csp = require('helmet-csp');
var archiver = require('archiver');
var csvWriter = require('csv-write-stream'); // For turning JSON into CSV
var services = require('./config/services');

var DEFAULT_LIMIT = 100000;
var DEFAULT_FETCH_SIZE = 1000;
var MAX_FETCH_SIZE = 1000;

// Create output directory to hold contents of this processing
var shortID = shortid.generate();
var outputDir = '/home/exouser/data/tmp/' + shortID + '/';
var dataFile = 'data.csv';
var outputDataFile = outputDir + dataFile;

// Location of data and citation policies files (stored in repository and copied to temporary directory that is archived and returned to client)
var dataDownloadMetadataFile = 'README.txt';
var citationAndDataUsePoliciesFile = 'citation_and_data_use_policies.txt';
var returnedArchiveFile = 'phenobase_download.zip';
var compressedArchiveLocation = '/tmp/' + shortID + '.zip';

// The client connection parameter, reading settings from connection.js
var client = require('./phenobase_connection.js');
// Set the default port
var port = Number(process.env.PORT || services.phenobaseDownloadV1.port);

// Security headers using Helmet and CSP
app.use(
  csp({
    directives: {
      defaultSrc: ["'self'", 'www.biscicol.org'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  })
);

// Main entry point for application, recognizing requests from client
app.use(
  cors({
    origin: '*',
  }),
  function (req, res, body) {
    // Allow connections from JS applications
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log(req.url);
    // Handle request parameters
    var limit = parseLimit(req.query.limit);
    console.log(req.query.q)
    var query = req.query.q;

    // Create the output directory
    console.log('output directory ' + outputDir);
    mkdirp(outputDir, function (err) {
      if (err) {
        console.error(err);
      } else {
        // Run the search function
        console.log('running search function');
        runSearch( query, limit, function (compressedArchiveResult) {
          if (compressedArchiveResult == null) {
            console.log("no results, return 204");
            fs.removeSync(outputDir);
            res.status(204).json({
              error: 'no results found',
            });
          } else {
            // Run download option send as attachment
            console.log('running download option send as attachment');
            res.download(compressedArchiveResult, returnedArchiveFile, function (err) {
              if (err) {
                console.log('err:' + err);
                // If there is some error, we don't remove files
              } else {
                console.log('sent:' + compressedArchiveResult);
                // Clean up files
                fs.removeSync(outputDir);
                fs.removeSync(compressedArchiveLocation);
              }
            });
          }
          source = null;
          query = null;
          limit = null;
        });
      }
    });
  }
);

/* runSearch command calls Elasticsearch */
function runSearch(query, limit = DEFAULT_LIMIT, callback) {
  var writer = csvWriter();
  var writeStream = fs.createWriteStream(outputDataFile);
  writer.pipe(writeStream);

  // Counter
  var countRecords = 0;
  var fetchSize = getFetchSize(limit);
  const luceneQuery = query && query.trim() !== '' ? query : '*';

  // Execute client search with scrolling
  client.search(
    {
      index: 'phenobase2',
      size: fetchSize,
      scroll: '60s', // Keep the search results "scrollable" for 60 seconds
      q: luceneQuery,
    },
    function getMoreUntilDone(error, response) {
      if (error) {
        console.log("search error: " + error);
        return finishWithoutResults();
      } else {
        console.log("fetching data...");
        var totalPossible = getTotalHits(response);

        writeHits(response.hits.hits, function () {
          if (countRecords < 1) {
            return finishWithoutResults();
          }

          // Continue fetching until the count matches the limit or the total hits.
          if (shouldFetchMore(countRecords, totalPossible, limit)) {
            console.log(countRecords + " of " + totalPossible);
            client.scroll(
              {
                scrollId: response._scroll_id,
                scroll: '60s',
              },
              getMoreUntilDone
            );
          } else {
            finishWithArchive(totalPossible);
          }
        });
      }
    }
  );

  function writeHits(hits, done) {
    var index = 0;

    function writeNext() {
      while (index < hits.length && (limit === 0 || countRecords < limit)) {
        var hit = hits[index++];
        var canContinue = writer.write(hit._source);
        countRecords++;

        if (!canContinue) {
          writer.once('drain', writeNext);
          return;
        }
      }

      done();
    }

    writeNext();
  }

  function finishWithoutResults() {
    writeStream.on('finish', function () {
      return callback(null);
    });
    writer.end();
  }

  function finishWithArchive(totalPossible) {
    // Wait for the writeStream to finish before archiving and returning the result
    writeStream.on('finish', function () {
      // Create metadata and policy files
      createDownloadMetadataFile(query, limit, totalPossible, countRecords );
      createCitationAndDataUsePoliciesFile();

      // Create the archive
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Sets the compression level.
      });
      const output = fs.createWriteStream(compressedArchiveLocation);

      // Listen for all archive data to be written 'close' event is fired only when a file descriptor is involved
      output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
        return callback(compressedArchiveLocation);
      });

      archive.pipe(output);
      archive.directory(outputDir, false);
      archive.finalize();
    });

    writer.end();
  }
}

function parseLimit(limit) {
  if (limit == null || limit === '') {
    return DEFAULT_LIMIT;
  }

  var parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 0) {
    return DEFAULT_LIMIT;
  }

  return parsedLimit;
}

function getFetchSize(limit) {
  var configuredFetchSize = parseInt(process.env.PHENOBASE_DOWNLOAD_FETCH_SIZE, 10);
  var fetchSize = isNaN(configuredFetchSize) || configuredFetchSize < 1 ? DEFAULT_FETCH_SIZE : configuredFetchSize;

  fetchSize = Math.min(fetchSize, MAX_FETCH_SIZE);

  if (limit > 0) {
    fetchSize = Math.min(fetchSize, limit);
  }

  return fetchSize;
}

function getTotalHits(response) {
  if (typeof response.hits.total === 'number') {
    return response.hits.total;
  }

  return response.hits.total.value;
}

function shouldFetchMore(countRecords, totalPossible, limit) {
  return countRecords < totalPossible && (limit === 0 || countRecords < limit);
}

function createResponse(status, body) {
  return {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    statusCode: status,
    body: JSON.stringify(body),
  };
}

// Create the citation file
function createCitationAndDataUsePoliciesFile() {
  fs.copySync('phenobase_data/' + citationAndDataUsePoliciesFile, outputDir + citationAndDataUsePoliciesFile);
}

// Create the metadata File
function createDownloadMetadataFile(query, limit, totalPossible, totalReturned ) {
  // Create the data-download_metadata file
  // Turn obo: into a hyperlink so users can click through to figure out what we are talking about by "obo:"
  //query = query.replace(/obo:/g, 'http://purl.obolibrary.org/obo/');
  dataDownloadMetadataText = "data file = " + dataFile + "\n";
  dataDownloadMetadataText += "date query ran = " + new Date() + "\n";
  dataDownloadMetadataText += "query = " + query + "\n";
  dataDownloadMetadataText += "fields returned = all \n";
  if (limit != 0) {
    dataDownloadMetadataText += "user specified limit = " + limit + "\n";
  }
  dataDownloadMetadataText += "total results possible = " + Number(totalPossible).toLocaleString() + "\n";
  dataDownloadMetadataText += "total results returned = " + Number(totalReturned).toLocaleString() + "\n";
  // Copy file to outputDir
  fs.copySync('data/' + dataDownloadMetadataFile, outputDir + dataDownloadMetadataFile);
  // Append file synchronously
  fs.appendFileSync(outputDir + dataDownloadMetadataFile, dataDownloadMetadataText);
}

// Server Listen
app.listen(port, function () {
  console.log('App server is running on http://localhost:' + port);
});
