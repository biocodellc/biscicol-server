var express = require('express');
var request = require('request');
var cors = require('cors');
var urllib = require('url')

var app = express();

var URL = 'http://128.196.254.92:80/geoserver'
var port = Number(process.env.PORT || 3012);
var apiServerHost = (URL)

//q=+plantStructurePresenceTypes:"obo:PPO_0002658" AND +year:>=1868 AND +year:<=2018 AND +dayOfYear:>=110 AND +dayOfYear:<=212 AND +genus:Acacia AND +source:USA-NPN
//q=+genus:Acacia

    // Listen for requests on all endpoints
    //app.use('/', function(req, res, body) {
    app.use(cors({origin: '*'}), function(req, res, body) {
            // allow connections from JS applications
            res.setHeader('Access-Control-Allow-Origin', '*');
            //
            // short-circuit favicon requests for easier debugging
            if (req.url != '/favicon.ico') {

            // Request method handling: exit if not GET or POST
            if ( ! (req.method == 'GET' || req.method == 'POST') ) {
                errMethod = { error: req.method + " request method is not supported. Use GET or POST." };
                console.log("ERROR: " + req.method + " request method is not supported.");
                res.write(JSON.stringify(errMethod));
                res.end();
                return;
            }

            req.query.viewParams = "myviewparams"    
            //var query = req.params.q;
            //console.log(req.query.viewParams)

            // pass the request to elasticsearch
            cleanrequrl = req.url.replace('//','/');
            var url = apiServerHost + cleanrequrl;

            console.log('req.method: ' + req.method);
            console.log('url: ' + url);
            req.pipe(request({
                uri  : url,
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
        console.log('Heroku config variable - ELASTIC_URL: ' + process.env.ELASTIC_URL);
        console.log('apiServerHost: ' + apiServerHost);
        });
