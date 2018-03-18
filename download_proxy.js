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
var prependFile = require('prepend-file');
var fs = require('fs');
// for creating short unique names to use in temp directory
var shortid = require('shortid')
// load expressJS
var express = require('express')
var request = require('request');
var cors = require('cors');
var app = express()
var helmet = require('helmet');
var csp = require('helmet-csp');
// for compression
var zlib = require('zlib')
// for trrning JSON into CSV
var csvWriter = require('csv-write-stream')
// Create output file (should use unique name)
var outputFile = '/tmp/' + shortid.generate()
// The client connection parameter, reading settings from connection.js
var client = require('./connection.js');
// set the default port
var port = Number(process.env.PORT || 3003);

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

    console.log(req.url)
    /*
        // The following will be input commands, sent from client
        var source = ['genus', 'dayOfYear', 'year', 'species', 'latitude']
        var body = {
            query: {
                match: {
                    "genus": "Zinnia"
                }
            }
        }
    */
    var source = req.query.source
    var query = req.query.q

    // run the search function, which queries elasticsearch
    runSearch(source, query, function(outputFile) {
        if (outputFile == null) {
            console.log("no results, return 204")
            res.json(204, { error: 'no results found' })
        } else {
          // run download option send as attachment
          res.download(outputFile, 'ppo_download.csv.gz', function(err) {
            if (err) {
                console.log('err:' + err)
            } else {
                console.log('sent:', outputFile);
                // clean up
                //                fs.unlinkSync(outputFile);
            }
          });
        }
    });
});


/* runSearch command calls elasticsearch */
function runSearch(source, query, callback) {
    var writer = csvWriter()
    writer.pipe(fs.createWriteStream(outputFile))
    // Counter
    var countRecords = 0
    //  Execute client search with scrolling
    client.search({
        index: '_all',
        size: 10000,
        //        size: 10000,    // set to max search buffer size, fastest execution for large sets
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
                if (typeof hit._source.latitude !== 'undefined')
                    writerRequestObject.latitude = hit._source.latitude
                if (typeof hit._source.longitude !== 'undefined')
                    writerRequestObject.longitude = hit._source.longitude
                if (typeof hit._source.plantStructurePresenceTypes !== 'undefined') 
                    writerRequestObject.plantStructurePresenceTypes = hit._source.plantStructurePresenceTypes
                if (typeof hit._source.source !== 'undefined') {
                    var source = hit._source.source
                    // quick hack to change NPN to USA-NPN until pipeline code is updated
                    if (source == "NPN") source = "USA-NPN"
                    writerRequestObject.source = source
                }
                if (typeof hit._source.eventId !== 'undefined')
                    writerRequestObject.eventId = hit._source.eventId

                // Use csv-write-stream tool to convert JSON to CSV
                writer.write(writerRequestObject)
                countRecords++;
            });

            if (countRecords < 1) {
                return callback(null);//, createResponse(204, "no results"))
            }
            // While the count of records is less than the total hits, continue
            if (countRecords < response.hits.total) {
                // Ask elasticsearch for the next set of hits from this search
                client.scroll({
                    scrollId: response._scroll_id,
                    scroll: '60s'
                }, getMoreUntilDone);
            } else {
                // Close Stream
                writer.end()

                // wait for writer to finish before calling everything here
                writer.on('finish', function() {

                    // turn obo: into a hyperlink so users can click through to 
                    // figure out what we are talking about by "obo:"
                    query = query.replace(/obo:/g,'http://purl.obolibrary.org/obo/')

                    // Pre-pend the query to the CSV file that was just written
                    prependFile(outputFile, 'query=' + query + '\n', function(err) {
                        if (err) throw err;
                        console.log('Header text prepended!');

                        // Compress File
                        var gzip = zlib.createGzip();
                        var r = fs.createReadStream(outputFile);
                        var w = fs.createWriteStream(outputFile + '.gz');

                        r.pipe(gzip).pipe(w);
                        fs.unlinkSync(outputFile);
                        // This is a bit of hack, however, i spent awhile debugging
                        // why file was not finished closing before return.  Apparently,
                        // there is a slight delay in the OS before the file is done 
                        // closing which takes longer than Node returning the file 
                        // itself.  So, we wait 4 second before the response.
                        setTimeout(function() {
                            return callback(outputFile + '.gz')
                        }, 4000);

                    });

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
// Server Listen
app.listen(port, function() {
    console.log('App server is running on http://localhost:' + port);
});
