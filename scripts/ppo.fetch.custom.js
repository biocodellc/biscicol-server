/* ppo.custom.fetchall.js
   A node script for fetching custom result sets for PPO
*/


// Here is the where the custom query  goes
//var myquery = 'subSource:"ADF Nature Log" AND mapped_traits:"abscised fruits or seeds present"';
// query for Rob on march 14, 2022
var myquery = 'scientificName:"hippocastanum" AND genus:"Aesculus" AND source:"PEP725"  AND  status:"present"  AND  mapped_traits:"flowers present"'
// Output is written to data/downloadable/custom.ppo.[shortID].zip
var limit = 0

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
var outputDir = '/home/exouser/data/tmp/' + shortID + '/'
var dataFile = 'data.csv'
var outputDataFile = outputDir + dataFile
// Location of data and citation policies files (stored in repository and
// copied to temporary directory that is archived and returned to client)
var dataDownloadMetadataFile = 'README.txt'
var citationAndDataUsePoliciesFile = 'citation_and_data_use_policies.txt'
var archiver = require('archiver');

//var returnedArchiveFile = 'futres_download.tar.gz'
var returnedArchiveFile = 'custom.ppo.'+shortID+'.zip'
var compressedArchiveLocation = '../data/downloadable/' + returnedArchiveFile

// The client connection parameter, reading settings from connection.js
var client = require('../connection.js');


/* runSearch command calls elasticsearch */
var search = function runSearch(source, query, limit, callback) {
    query = myquery
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
        index: 'ppo',
        size: fetchSize,
        scroll: '60s', // keep the search results "scrollable" for 30 seconds
        //        _source: source, // filter the source to only include the title field
        //        body: body
        q: query
    }, function getMoreUntilDone(error, response) {
        if (error) {
            console.log("search error: " + error)
        } else {
            // Loop the response (the number of loops equals the size request)
            response.hits.hits.forEach(function(hit) {
                var writerRequestObject = new Object()
                // Handle expected field names from PPO server
 		if (typeof hit._source.dayOfYear !== 'undefined')
                    writerRequestObject.dayOfYear = hit._source.dayOfYear
                if (typeof hit._source.year !== 'undefined')
                    writerRequestObject.year = hit._source.year
                if (typeof hit._source.genus !== 'undefined')
                    writerRequestObject.genus = hit._source.genus
                if (typeof hit._source.specificEpithet !== 'undefined')
                    writerRequestObject.specificEpithet = hit._source.specificEpithet
                if (typeof hit._source.eventRemarks!== 'undefined')
                    writerRequestObject.eventRemarks= hit._source.eventRemarks
                if (typeof hit._source.latitude !== 'undefined')
                    writerRequestObject.latitude = hit._source.latitude
                if (typeof hit._source.longitude !== 'undefined')
                    writerRequestObject.longitude = hit._source.longitude
		// Re-write plantStructurePresenceTypes to termID, to match usage
                //if (typeof hit._source.plantStructurePresenceTypes !== 'undefined')
                 //   writerRequestObject.termID = hit._source.plantStructurePresenceTypes
                if (typeof hit._source.source !== 'undefined') {
                    var source = hit._source.source
                    // quick hack to change NPN to USA-NPN until pipeline code is updated
                    if (source == "NPN") source = "USA-NPN"
                    writerRequestObject.source = source
                }
                if (typeof hit._source.eventId !== 'undefined')
                    writerRequestObject.eventId = hit._source.eventId

		if (typeof hit._source.mapped_traits !== 'undefined') {
                   mapped_traits = hit._source.mapped_traits
                   mapped_traits_string = ''
                   for(var i=0;i<mapped_traits.length;i++){
                        if (i > 0) {
                                mapped_traits_string += '|'
                        }
                        mapped_traits_string += mapped_traits[i]
                    }
                    writerRequestObject.inferred_traits = mapped_traits_string
                }
                // Use csv-write-stream tool to convert JSON to CSV
                writer.write(writerRequestObject)
                countRecords++;
                writeRequestObject = null;
            });

            if (countRecords < 1) {
                return callback(null); 
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
		    //
                // wait for writeStream to finish before calling everything here
                writeStream.on('finish', function() {
                    // Create Policies Files
                    createDownloadMetadataFile(query, limit, response.hits.total.value, countRecords, source);
                    createCitationAndDataUsePoliciesFile();

		    console.log("zipping results");
		    const archive = archiver('zip', {
  			zlib: { level: 9 } // Sets the compression level.
		    });
		    console.log("archive location " + compressedArchiveLocation)
 		    const output = fs.createWriteStream(compressedArchiveLocation);
			
		    // listen for all archive data to be written 'close' event is fired only when a file descriptor is involved
		    output.on('close', function() {
  		        console.log(archive.pointer() + ' total bytes');
  		        console.log('archiver has been finalized and the output file descriptor has closed.');
                        //return callback(compressedArchiveLocation);
		    });

		    console.log("output")
		    archive.pipe(output);
		    console.log("directory to zip = " + outputDir)
		    archive.directory(outputDir, false);
		    console.log("finalizing")
		    archive.finalize();
                });
            }
        }
    });
}

// Create the citation file
function createCitationAndDataUsePoliciesFile() {
    fs.copySync('../data/' +citationAndDataUsePoliciesFile, outputDir + citationAndDataUsePoliciesFile);
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
    fs.copySync('../data/' +dataDownloadMetadataFile, outputDir + dataDownloadMetadataFile);
    // append file synchronously
    fs.appendFileSync(outputDir + dataDownloadMetadataFile, dataDownloadMetadataText);
}

    var source = null
    var query = null

    // Create the output Directory
    mkdirp(outputDir, function(err) {
        if (err) {
            console.error(err)
        } else {
            // Run the Search Function
            search(source, query, limit, function(compressedArchiveResult) {
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
                            console.log('sent:' + compressedArchiveResult + ' as ' +returnedArchiveFile);
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
