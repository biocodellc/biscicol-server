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

// Create output directory to hold contents of this processing
var shortID = shortid.generate();
var outputDir = '/home/exouser/data/tmp/' + shortID + '/';
var dataFile = 'data.csv';
var outputDataFile = outputDir + dataFile;

// Location of data and citation policies files (stored in repository and copied to temporary directory that is archived and returned to client)
var dataDownloadMetadataFile = 'README.txt';
var citationAndDataUsePoliciesFile = 'citation_and_data_use_policies.txt';
var returnedArchiveFile = 'arctos_download.zip';
var compressedArchiveLocation = '/tmp/' + shortID + '.zip';

// The client connection parameter, reading settings from connection.js
var client = require('./phenobase_connection.js');
// Set the default port
var port = Number(process.env.PORT || 3622);

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
    var limit = parseInt(req.query.limit) || 100000; // Default to 100,000 if not specified
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
function runSearch(query, limit = 100000, callback) {
  var writer = csvWriter();
  var writeStream = fs.createWriteStream(outputDataFile);
  writer.pipe(writeStream);

  // Counter
  var countRecords = 0;
  var fetchSize = Math.min(10000, limit); // Fetch size is capped by the limit
 const luceneQuery = query && query.trim() !== '' ? query : '*';


  // Execute client search with scrolling
  client.search(
    {
      index: 'arctos',
      size: fetchSize,
      scroll: '60s', // Keep the search results "scrollable" for 60 seconds
      q: luceneQuery,
    },
    function getMoreUntilDone(error, response) {
      if (error) {
        console.log("search error: " + error);
      } else {
        console.log("fetching data...");
        // Loop through the response
        response.hits.hits.forEach(function (hit) {
          writer.write(hit._source);
          countRecords++;
        });

        if (countRecords < 1) {
          return callback(null);
        }

        // Continue fetching until the count matches the limit or the total hits
        if ((countRecords < response.hits.total.value && limit === 0) || (countRecords < limit && countRecords < response.hits.total.value)) {
          //console.log(countRecords + " of " + response.hits.total.value);
          client.scroll(
            {
              scrollId: response._scroll_id,
              scroll: '60s',
            },
            getMoreUntilDone
          );
        } else {
          writer.end();

          // Wait for the writeStream to finish before archiving and returning the result
          writeStream.on('finish', function () {
            // Create metadata and policy files
            createDownloadMetadataFile(query, limit, response.hits.total.value, countRecords );
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
        }
      }
    }
  );
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
  fs.copySync('arctos_data/' + citationAndDataUsePoliciesFile, outputDir + citationAndDataUsePoliciesFile);
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

