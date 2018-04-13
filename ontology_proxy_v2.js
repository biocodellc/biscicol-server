/*
A service to return pre-parsed parts of the plant phenology ontology
*/
var fs = require('fs')
var express = require('express');
var request = require('request');
var cors = require('cors');
var app = express();

// define the port
var port = Number(process.env.PORT || 3008);

// Spin up application and handle requests
app.use(cors({origin: '*'}), function(req, res, body) {
	// allow connections from JS applications
        // short-circuit favicon requests for easier debugging
	res.setHeader('Access-Control-Allow-Origin', '*'); 
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
                    if (req.url.includes("present_short")) {
                        returnResponse("data/present_short.json",res)
                    } else if (req.url.includes("absent_short")) {
                        returnResponse("data/absent_short.json",res)
                    } else if (req.url.includes("all_short")) {
                        returnResponse("data/all_short.json",res)
                    } else if (req.url.includes("present")) {
                        returnResponse("data/present.json",res)
                    } else if (req.url.includes("absent")) {
                        returnResponse("data/absent.json",res)
                    } else if (req.url.includes("all")) {
                        returnResponse("data/all.json",res)
                    } else { 
			res.write("[{'message':'call either /present/ or /absent/ services'}]");
		        res.end();
                    }
                    return;
                } catch(err){
                    console.log(err);
                }
	}
});

function returnResponse(file,res) {
    fs.readFile(file, function read(err,data) {
        if (err) {
            throw err;
        }
        res.write(data)
        res.end();
    });
}

// Create the server and listen on specified port
app.listen(port, function () {
	console.log('App server is running on http://localhost:' + port);
});
