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
var returnedArchiveFile = 'phenobase_download.zip';
var compressedArchiveLocation = '/tmp/' + shortID + '.zip';

// The client connection parameter, reading settings from connection.js
var client = require('./connection.js');
// Set the default port
var port = Number(process.env.PORT || 3602);

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

    // Handle request parameters
    console.log(req.url);
    var source = req.query.source;
    var query = req.query.q;
    var limit = parseInt(req.query.limit) || 100000; // Default to 100,000 if not specified
    console.log('query = ' + query);

    // Create the output directory
    console.log('output directory ' + outputDir);
    mkdirp(outputDir, function (err) {
      if (err) {
        console.error(err);
      } else {
        // Run the search function
        console.log('running search function');
        runSearch(source, query, limit, function (compressedArchiveResult) {
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
function runSearch(source, query, limit = 100000, callback) {
  var writer = csvWriter();
  var writeStream = fs.createWriteStream(outputDataFile);
  writer.pipe(writeStream);

  // Counter
  var countRecords = 0;
  var fetchSize = Math.min(10000, limit); // Fetch size is capped by the limit

  // Execute client search with scrolling
  client.search(
    {
      index: '_all',
      size: fetchSize,
      scroll: '60s', // Keep the search results "scrollable" for 60 seconds
      q: query,
    },
    function getMoreUntilDone(error, response) {
      if (error) {
        console.log("search error: " + error);
      } else {
        console.log("fetching data...");
        // Loop through the response
        response.hits.hits.forEach(function (hit) {
          var writerRequestObject = new Object()
         
          writerRequestObject.machine_learning_annotation_id = hit._source.machine_learning_annotation_id
          writerRequestObject.human_observation_annotation_id = hit._source.human_observation_annotation_id
          writerRequestObject.datasource = hit._source.datasource
          writerRequestObject.verbatim_date = hit._source.verbatim_date
          writerRequestObject.day_of_year = hit._source.day_of_year
          writerRequestObject.year = hit._source.year
          writerRequestObject.latitude = hit._source.latitude
          writerRequestObject.longitude = hit._source.longitude
          writerRequestObject.coordinate_uncertainty_meters = hit._source.coordinate_uncertainty_meters
          writerRequestObject.family = hit._source.family
          writerRequestObject.count_family = hit._source.count_family
          writerRequestObject.genus = hit._source.genus
          writerRequestObject.scientific_name = hit._source.scientific_name
          writerRequestObject.taxon_rank = hit._source.taxon_rank
          writerRequestObject.basis_of_record = hit._source.basis_of_record
          writerRequestObject.individual_id = hit._source.individual_id
          writerRequestObject.occurrence_id = hit._source.occurrence_id
          writerRequestObject.verbatim_trait = hit._source.verbatim_trait
          writerRequestObject.trait = hit._source.trait
          writerRequestObject.observed_image_guid = hit._source.observed_image_guid
          writerRequestObject.observed_image_url = hit._source.observed_image_url
          writerRequestObject.observed_metadata_url = hit._source.observed_metadata_url
          writerRequestObject.certainty = hit._source.certainty
          writerRequestObject.model_uri = hit._source.model_uri
          writerRequestObject.error_message = hit._source.error_message
          writerRequestObject.predition_probability = hit._source.predition_probability
          writerRequestObject.prediction_class = hit._source.prediction_class
          writerRequestObject.proportion_certainty_family = hit._source.proportion_certainty_family
          writerRequestObject.accuracy_excluding_certainty_family = hit._source.accuracy_excluding_certainty_family
          writerRequestObject.accuracy_family = hit._source.accuracy_family
          writerRequestObject.mapped_traits = hit._source.mapped_traits
          //
          // Use csv-write-stream tool to convert JSON to CSV
          writer.write(writerRequestObject);
          countRecords++;
                          writeRequestObject = null;
        });

        if (countRecords < 1) {
          return callback(null);
        }

        // Continue fetching until the count matches the limit or the total hits
        if ((countRecords < response.hits.total.value && limit === 0) || (countRecords < limit && countRecords < response.hits.total.value)) {
          console.log(countRecords + " of " + response.hits.total.value);
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
            createDownloadMetadataFile(query, limit, response.hits.total.value, countRecords, source);
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
  fs.copySync('phenobase_data/' + citationAndDataUsePoliciesFile, outputDir + citationAndDataUsePoliciesFile);
}

// Create the metadata File
function createDownloadMetadataFile(query, limit, totalPossible, totalReturned, source) {
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

