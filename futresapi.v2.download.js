/* download_proxy.js
   A quick and dirty script to serve up from node for facilitating downloads of
   large files from elasticsearch
   Since our ES instance is on another server and responses and i didn't want to
   mess with ES compression, here is a method to fetch ES, turn into CSV,
   compress (all on a FAST connection), and then return to client as gzipped
   CSV file.   This method makes the client experience fast, limiting the IO
   to their connection and makes delivering large queries manageable

   By default we query _all indexes, and use scrolling to get ALL results, in increments
   of 10,000

   Queries are handled by looking at lucene-type queries in the GET Parameters looking
   for q= and source requests are handled looking at _source= variable
   */


// load required libraries
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
// for creating short unique names to use in temp directory
var shortid = require('shortid')
// load expressJS
var express = require('express')
var request = require('request');
var cors = require('cors');
var tar = require('tar');
var app = express()
var helmet = require('helmet');
var csp = require('helmet-csp');
// for compression
//var zlib = require('zlib')
// for trrning JSON into CSV
var csvWriter = require('csv-write-stream')
// Create output diretory to hold contents of this processing
var shortID = shortid.generate()
var outputDir = '/tmp/' + shortID + '/'
var dataFile = 'data.csv'
var outputDataFile = outputDir + dataFile
// Location of data and citation policies files (stored in repository and
// copied to temporary directory that is archived and returned to client)
var dataDownloadMetadataFile = 'FUTRES_README.txt'
var citationAndDataUsePoliciesFile = 'futres_citation_and_data_use_policies.txt'

var returnedArchiveFile = 'futres_download.tar.gz'
var compressedArchiveLocation = '/tmp/' + shortID + '.tar.gz'

// The client connection parameter, reading settings from connection.js
var client = require('./connection.js');
// set the default port
var port = Number(process.env.PORT || 3024);

// @see https://github.com/evilpacket/helmet
// you should activate even more headers provided by helmet
app.use(csp({
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
    }
}));

/* The main entry point for application, recognizing requests from client */
app.use(cors({
    origin: '*'
}), function(req, res, body) {
    // allow connections from JS applications
    res.setHeader('Access-Control-Allow-Origin', '*');

    // handle request parameters
    console.log(req.url)
    var source = req.query.source
    var query = req.query.q
    var limit = req.query.limit

    // replace incoming termID request with plantStructurePresenceTypes
    //query = query.replace('termID', 'plantStructurePresenceTypes')

    // setting limit to 0 means there is no limit
    if (limit == null || limit == 'undefined') {
        limit = 0;
    }

    // Create the output Directory
    mkdirp(outputDir, function(err) {
        if (err) {
            console.error(err)
        } else {
            // Run the Search Function
            runSearch(source, query, limit, function(compressedArchiveResult) {
                if (compressedArchiveResult == null) {
                    console.log("no results, return 204")
                    res.json(204, {
                        error: 'no results found'
                    })
                } else {
                    // run download option send as attachment
                    res.download(compressedArchiveResult, returnedArchiveFile, function(err) {
                        if (err) {
                            console.log('err:' + err)
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
});


/* runSearch command calls elasticsearch */
function runSearch(source, query, limit, callback) {
    console.log(source)
    var writer = csvWriter()
    var writeStream = fs.createWriteStream(outputDataFile)
    writer.pipe(writeStream)
    // Counter
    var countRecords = 0
    var fetchSize = 10000 // size should be set to a large value.. by default is 10,0000
    if (limit > 0 && fetchSize > limit) {
        fetchSize = limit
    }

    //  Execute client search with scrolling
    client.search({
        index: 'futres',
        size: fetchSize,
        scroll: '60s', // keep the search results "scrollable" for 30 seconds
        //        _source: source, // filter the source to only include the title field
        //        body: body
        q: query
    }, function getMoreUntilDone(error, response) {
	    // JBD
	    console.log(response)
        if (error) {
            console.log("search error: " + error)
        } else {
            // Loop the response (the number of loops equals the size request)
            response.hits.hits.forEach(function(hit) {
                var writerRequestObject = new Object()
                // Handle expected field names from FOVT server
                if (typeof hit._source.materialSampleID !== 'undefined')
                    writerRequestObject.materialSampleID = hit._source.materialSampleID
                if (typeof hit._source.individualID !== 'undefined')
                    writerRequestObject.individualID = hit._source.individualID
                if (typeof hit._source.country !== 'undefined')
                    writerRequestObject.country = hit._source.country
                if (typeof hit._source.locality !== 'undefined')
                    writerRequestObject.locality = hit._source.locality
                if (typeof hit._source.yearCollected !== 'undefined')
                    writerRequestObject.yearCollected = hit._source.yearCollected
                if (typeof hit._source.samplingProtocol !== 'undefined')
                    writerRequestObject.samplingProtocol = hit._source.samplingProtocol
                if (typeof hit._source.basisOfRecord !== 'undefined')
                    writerRequestObject.basisOfRecord = hit._source.basisOfRecord
                if (typeof hit._source.scientificName !== 'undefined')
                    writerRequestObject.scientificName = hit._source.scientificName
                if (typeof hit._source.measurementMethod !== 'undefined')
                    writerRequestObject.measurementMethod = hit._source.measurementMethod 
                if (typeof hit._source.measurementUnit !== 'undefined')
                    writerRequestObject.measurementUnit = hit._source.measurementUnit
                if (typeof hit._source.measurementType !== 'undefined')
                    writerRequestObject.measurementType = hit._source.measurementType
                if (typeof hit._source.measurementValue !== 'undefined')
                    writerRequestObject.measurementValue = hit._source.measurementValue
                if (typeof hit._source.lifeStage !== 'undefined')
                    writerRequestObject.lifeStage = hit._source.lifeStage
                if (typeof hit._source.sex !== 'undefined')
                    writerRequestObject.sex = hit._source.sex
                if (typeof hit._source.mapped_project !== 'undefined')
                    writerRequestObject.mapped_project = hit._source.mapped_project
                if (typeof hit._source.decimalLatitude !== 'undefined')
                    writerRequestObject.decimalLatitude = hit._source.decimalLatitude
                if (typeof hit._source.decimalLongitude !== 'undefined')
                    writerRequestObject.decimalLongitude = hit._source.decimalLongitude
                if (typeof hit._source.projectID !== 'undefined') {
                    if (hit._source.projectID == "Vertnet")
                        writerRequestObject.projectID = hit._source.projectID 
                    else   
                        writerRequestObject.projectID = "https://geome-db.org/workbench/project-overview?projectId="+hit._source.projectID 
                }

                // Use csv-write-stream tool to convert JSON to CSV
                writer.write(writerRequestObject)
                countRecords++;
                writeRequestObject = null;
            });

            if (countRecords < 1) {
                return callback(null); //, createResponse(204, "no results"))
            }
            // While the count of records is less than the total hits, continue
            // OR the limit is less than the response hits
            if ((countRecords < response.hits.total.value && limit == 0) || (countRecords < limit && limit < response.hits.total.value)) {
                console.log(countRecords + " of " + response.hits.total.value)
                // Ask elasticsearch for the next set of hits from this search
                client.scroll({
                    scrollId: response._scroll_id,
                    scroll: '60s'
                }, getMoreUntilDone);
            } else {
                writer.end()
                // Close Stream
                //countRecords = null;

                // wait for writeStream to finish before calling everything here
                writeStream.on('finish', function() {
                    // Create Policies Files
                    createDownloadMetadataFile(query, limit, response.hits.total.value, countRecords, source);
                    createCitationAndDataUsePoliciesFile();

                    tar.c({
                        gzip: true,
                        file: compressedArchiveLocation,
                        cwd: outputDir,
                        prefix: 'futres_download',
                        sync: true
                    }, [dataFile, dataDownloadMetadataFile, citationAndDataUsePoliciesFile]);
                    return callback(compressedArchiveLocation);
                });
            }
        }
    });
}

function createResponse(status, body) {
    return {
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        statusCode: status,
        body: JSON.stringify(body)
    }
}

// Create the citation file
function createCitationAndDataUsePoliciesFile() {
    fs.copySync('futres_data/' + citationAndDataUsePoliciesFile, outputDir + citationAndDataUsePoliciesFile);
}

// Create the metadata File
function createDownloadMetadataFile(query, limit, totalPossible, totalReturned, source) {
    // Create the data-download_metadata file
    // turn obo: into a hyperlink so users can click through to
    // figure out what we are talking about by "obo:"
    //query = query.replace(/obo:/g, 'http://purl.obolibrary.org/obo/')
    dataDownloadMetadataText = "data file = " + dataFile + "\n";
    dataDownloadMetadataText += "date query ran = " + new Date() + "\n"
    dataDownloadMetadataText += "query = " + query + "\n"
    //dataDownloadMetadataText += "fields returned = dayOfYear,year,genus,specificEpithet,latitude,longitude,source,eventId\n"
    if (limit != 0) {
        dataDownloadMetadataText += "user specified limit = " + limit + "\n"
    }
    dataDownloadMetadataText += "total results possible = " + Number(totalPossible).toLocaleString() + "\n"
    dataDownloadMetadataText += "total results returned = " + Number(totalReturned).toLocaleString() + "\n"
    // copy file to outputDir
    fs.copySync('futres_data/' + dataDownloadMetadataFile, outputDir + dataDownloadMetadataFile);
    // append file synchronously
    fs.appendFileSync(outputDir + dataDownloadMetadataFile, dataDownloadMetadataText);
}

// Server Listen
app.listen(port, function() {
    console.log('App server is running on http://localhost:' + port);
});
