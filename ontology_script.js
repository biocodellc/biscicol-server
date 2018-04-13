/*
A service to parse the plant phenology ontology and return relevant parts
*/
var fs = require('fs')
var $rdf = require('rdflib');
var express = require('express');
var request = require('request');
var cors = require('cors');
var app = express();
var sortBy = require('sort-by');

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

$rdf.parse(rdfData,store,baseUrl,contentType);

// walk all classes and sort
presentClasses = classWalker([],'http://purl.obolibrary.org/obo/BFO_0000020','present').sort(sortBy('label'))
absentClasses = classWalker([],'http://purl.obolibrary.org/obo/BFO_0000020','absent').sort(sortBy('label'))
// deDuplicate
presentClasses = deDuplicate(presentClasses,'termID');
absentClasses = deDuplicate(absentClasses,'termID');
allClasses = presentClasses.concat(absentClasses).sort(sortBy('label'))

// Write long form of JSON files
writeFile("data/present.json",presentClasses);
writeFile("data/absent.json",absentJSON = absentClasses);
writeFile("data/all.json",allClasses);

// Write short form of JSON files
writeFile("data/present_short.json",createShortFile(presentClasses))
writeFile("data/absent_short.json",createShortFile(absentClasses))
writeFile("data/all_short.json",createShortFile(allClasses))

// Create short form of classes (just label and ID)
function createShortFile(traitClass) {
    var shortForm = {}
    for(var item of traitClass) { 
        shortForm[item.label] = item.termID 
    }
    return shortForm;
}

// Write file out
function writeFile(path,traitClass) {
    jsonText = JSON.stringify(traitClass)
    fs.writeFile(path,jsonText,function(err) {
        if (err) {
            console.log("error writing file: " + err)   
        }
    });
}

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
            if (labelTriple.value.includes(filter) && !labelTriple.value.includes("plant structures")) {
                results.push(plantStage)
            }
            classWalker(results,triple.subject,filter)
        }
    });
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
