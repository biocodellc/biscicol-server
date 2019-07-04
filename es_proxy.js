var express = require('express');
var request = require('request');
var cors = require('cors');

var app = express();

var port = Number(process.env.PORT || 3001);
var apiServerHost = (process.env.ELASTIC_URL || 'http://128.196.254.92:80')

// Listen for requests on all endpoints
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

		// The incoming requesting string now contains a reference that should be removed
		req.url = req.url.replace('api/v1/query/','')
		// pass the request to elasticsearch
                var url = apiServerHost + req.url;
		req.pipe(request({
		    uri  : url,
		    auth : {
		        user : 'username',
		        pass : 'password'
		    },
				headers: {
					'accept-encoding': 'none'
				},
		    rejectUnauthorized : false,
		}, function(err, res, body) {
			// you could do something here before returning the response
		})).pipe(res); // return the elasticsearch results to the user
	}
});

// Server Listen
app.listen(port, function () {
	console.log('App server is running on http://localhost:' + port);
	console.log('apiServerHost: ' + apiServerHost);
});
