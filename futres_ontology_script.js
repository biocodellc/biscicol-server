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
var rdfData=fs.readFileSync('../fovt/fovt.owl').toString();

var contentType='application/rdf+xml';
var baseUrl="http://futres.org/";
var rdfsSubClassOf = $rdf.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf')
var rdfsLabel = $rdf.sym('http://www.w3.org/2000/01/rdf-schema#label')
var definitionLabel = $rdf.sym('http://purl.obolibrary.org/obo/IAO_0000115')

$rdf.parse(rdfData,store,baseUrl,contentType);

// walk all classes and sort
presentClasses = classWalker([],'http://purl.obolibrary.org/obo/PATO_0001708','present').sort(sortBy('label'))
// deDuplicate
presentClasses = deDuplicate(presentClasses,'termID');

// Write long form of JSON files
writeFile("futres_data/all.json",presentClasses);

// Write short form of JSON files
writeFile("futres_data/all_short.json",createShortFile(presentClasses))

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
            console.log(triple.subject.uri)
            // populate a labelTriple to hold the information for the rdfsLabel
            var labelTriple = store.any($rdf.sym(triple.subject.uri), rdfsLabel, undefined)
            console.log("   labelTriple="+labelTriple)
            // populate a definitionTriple to hold the information for the definition
            var definitionTriple = store.any($rdf.sym(triple.subject.uri), definitionLabel, undefined)
            console.log("   defTriple="+definitionTriple)
            // Create a plantStage object to hold the JSON attributes for each stage
            var plantStage = {}
            // the default URI will be the abbreviated version, this is because this is what is stored in ES datastore
            plantStage.termID =  triple.subject.uri.replace('http://purl.obolibrary.org/obo/','obo:')
            plantStage.label = labelTriple.value
            try {
                plantStage.definition = definitionTriple.value
            } catch (error) {
                plantStage.definition = "unable to get definition from ontology"
            }
            plantStage.uri =  triple.subject.uri
            // If the filter statement is present and includes the filter string in the given literal value
            // we push the object onto our stack
            //if (!filter || (filter && labelTriple.value.includes(filter))) {
            //if (labelTriple.value.includes(filter) && !labelTriple.value.includes("plant structures")) {
            //if (labelTriple.value.includes(filter)) { 
            results.push(plantStage)
            //}
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
