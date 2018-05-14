/*
A service to parse the plant phenology ontology and return relevant parts
*/
var fs = require('fs')
var $rdf = require('rdflib');
var express = require('express');
var request = require('request');
var cors = require('cors');
var app = express();

// define the port
var port = Number(process.env.PORT || 3000);

// create the graph store object
var store=$rdf.graph();

// This is the ontology file to read. To save IO i've checked out the file
// to the local filesystem, poining to a specific release
var rdfData=fs.readFileSync('../ppo/releases/2017-10-20/ppo.owl').toString();
var contentType='application/rdf+xml';

var baseUrl="http://plantphenology.org/";
var rdfsSubClassOf = $rdf.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf')
var rdfsLabel = $rdf.sym('http://www.w3.org/2000/01/rdf-schema#label')
var definitionLabel = $rdf.sym('http://purl.obolibrary.org/obo/IAO_0000115')

// Spin up application and handle requests
app.use(cors({origin: '*'}), function(req, res, body) {
	// allow connections from JS applications
	res.setHeader('Access-Control-Allow-Origin', '*');
	// short-circuit favicon requests for easier debugging
	if (req.url != '/favicon.ico') {
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
                    if (req.url.includes("present")) {
                        $rdf.parse(rdfData,store,baseUrl,contentType);
                        presentClasses = classWalker([],'http://purl.obolibrary.org/obo/BFO_0000020','present')
                        res.write(JSON.stringify(deDuplicate(presentClasses,'termID')));
                    } else if (req.url.includes("absent")) {
                        $rdf.parse(rdfData,store,baseUrl,contentType);
                        absentClasses = classWalker([],'http://purl.obolibrary.org/obo/BFO_0000020','absent')
                        res.write(JSON.stringify(deDuplicate(absentClasses,'termID')));
                    } else if (req.url.includes("all")) {
                        $rdf.parse(rdfData,store,baseUrl,contentType);
                        presentClasses = classWalker([],'http://purl.obolibrary.org/obo/BFO_0000020','present')
                        absentClasses = classWalker([],'http://purl.obolibrary.org/obo/BFO_0000020','absent')
                        allClasses = presentClasses.concat(absentClasses)
                        res.write(JSON.stringify(deDuplicate(allClasses,'termID')));
                    } else { 
			res.write("[{'message':'call either /present/ or /absent/ services'}]");
                    }
                    presentClasses = null;
                    absentClasses = null;
                    allClasses = null;
		    res.end();
                    return;
                } catch(err){
                    console.log(err);
                }
	}
});

// Iterate all subclasses from a node, returning the rdfs:label
// and class uri in an array of JSON objects
// This function is meant to be called recursively
function classWalker(results, startingClass,filter) {
    rootClass = $rdf.sym(startingClass)
    // find all triples that are a subClass of the passed in root class
    // I couldn't find a way to get rdflib to match all matching subClasses for the given root
    // as apparently this leel of reasoning is not included here (i didn't fully verify the
    // reasoning capacity though!).  In any case, we can iterate on each subclass axiom
    // and continue calling classWalker for each node
    allTriples = store.statementsMatching(undefined, rdfsSubClassOf, rootClass)
    
    allTriples.forEach(function(triple) {
        var termID = triple.subject.uri
        if (termID) {
            // populate a labelTriple to hold the information for the rdfsLabel
            var labelTriple = store.any($rdf.sym(triple.subject.uri), rdfsLabel, undefined )
            // populate a definitionTriple to hold the information for the definition
            var definitionTriple = store.any($rdf.sym(triple.subject.uri), definitionLabel, undefined )
            // Create a plantStage object to hold the JSON attributes for each stage
            var plantStage = {}
            // the default URI will be the abbreviated version, this is because this is what is stored in ES datastore
            plantStage.termID =  triple.subject.uri.replace('http://purl.obolibrary.org/obo/','obo:')
            plantStage.label = labelTriple.value
            plantStage.definition = definitionTriple.value
            plantStage.uri =  triple.subject.uri
            // If the filter statement is present and includes the filter string in the given literal value
            // we push the object onto our stack
            //if (!filter || (filter && labelTriple.value.includes(filter))) {
            if (labelTriple.value.includes(filter)) {
                results.push(plantStage)
            }
            plantStage = null;
            classWalker(results,triple.subject,filter)
        }
    });
    allTriples = null;
    return results;
}

// deDuplicate an array based on a given key.
// the method we use to "walk" through RDF structure can yield duplicates for certain classes
// we handle duplicates after we populate our JSONarray by trimming by anything with a duplicate
// of the given "key" for the SOURCE array
function deDuplicate(SOURCE, key) {
        let length = SOURCE.length, result = [], seen = new Set();
        for (let index = 0; index < length; index++) {
                let value = SOURCE[index];
                if (!seen.has(value[key])) {
                        seen.add(value[key]);
                        result.push(value);
                } 
        }
        return result;
}

// Create the server and listen on specified port
app.listen(port, function () {
	console.log('App server is running on http://localhost:' + port);
});
