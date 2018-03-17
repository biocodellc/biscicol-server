/*
A service to parse the plant phenology ontology and return relevant parts
*/
var fs = require('fs')
var $rdf = require('rdflib');
var express = require('express');
var request = require('request');
var cors = require('cors');

var app = express();

var port = Number(process.env.PORT || 3000);

// Listen for requests on all endpoints

var store=$rdf.graph();

// This is the ontology file to read. To save IO i've checked out the file
// to the local filesystem, poining to a specific release
var rdfData=fs.readFileSync('../ppo/releases/2017-10-20/ppo.owl').toString();

var contentType='application/rdf+xml';
var baseUrl="http://plantphenology.org/";
var rdfsSubClassOf = $rdf.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf')
var rdfsLabel = $rdf.sym('http://www.w3.org/2000/01/rdf-schema#label')

//app.use('/', function(req, res, body) {
app.use(cors({origin: '*'}), function(req, res, body) {
	// allow connections from JS applications
	res.setHeader('Access-Control-Allow-Origin', '*');
	//
	// short-circuit favicon requests for easier debugging
	if (req.url != '/favicon.ico') {
		console.log('req.method: ' + req.method);
		console.log('req.url: ' + req.url);

		// Request method handling: exit if not GET or POST
		if ( ! (req.method == 'GET' || req.method == 'POST') ) {
			errMethod = { error: req.method + " request method is not supported. Use GET or POST." };
			console.log("ERROR: " + req.method + " request method is not supported.");
			res.write(JSON.stringify(errMethod));
			res.end();
			return;
		}

                try{
                    if (req.url == "/present/") {
                        $rdf.parse(rdfData,store,baseUrl,contentType);
                        presentClasses = classWalker([],'http://purl.obolibrary.org/obo/PPO_0002300',undefined)
                        res.write(JSON.stringify(presentClasses));
                        res.end();
                        return;
                    } else if (req.url == "/absent/") {
                        $rdf.parse(rdfData,store,baseUrl,contentType);
                        absentClasses = classWalker([],'http://purl.obolibrary.org/obo/BFO_0000020','absent')
                        res.write(JSON.stringify(absentClasses));
                        res.end();
                        return;
                    } else if (req.url == "/") {
			res.write("[{'message':'call either /present/ or /absent/ services'}]");
			res.end();
                    }
                } catch(err){
                    console.log(err);
                }

	}
});


// Iterate all subclasses from a node, returning the rdfs:label
// and class uri in an array of JSON objects
function classWalker(results, startingClass,filter) {
    rootClass = $rdf.sym(startingClass)
    allTriples = store.statementsMatching(undefined, rdfsSubClassOf, rootClass)
    
    allTriples.forEach(function(triple) {
        var uri = triple.subject.uri
        if (uri) {
            var labelTriple = store.any($rdf.sym(triple.subject.uri), rdfsLabel, undefined )
            var thisObject = {}
            thisObject.uri =  uri
            thisObject.label = labelTriple.value
            // only push onto array if filter passes
            if (!filter || (filter && labelTriple.value.includes(filter))) {
                results.push(thisObject)
            }
            classWalker(results,triple.subject,filter)
        }
    });
    return results;
}

// Server Listen
app.listen(port, function () {
	console.log('App server is running on http://localhost:' + port);
});
