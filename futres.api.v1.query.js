var express = require('express');
var request = require('request');
var cors = require('cors');

var app = express();

var port = Number(process.env.PORT || 3020);
var apiServerHost = (process.env.ELASTIC_URL || 'http://149.165.170.158:8081')

// Listen for requests on all endpoints
//app.use('/', function(req, res, body) {
app.use(cors({origin: '*'}), function(req, res, body) {
  // allow connections from JS applications
  res.setHeader('Access-Control-Allow-Origin', '*');
  //
  // short-circuit favicon requests for easier debugging
  if (req.url != '/favicon.ico') {
    console.log('req.method: ' + req.method);

    // Request method handling: exit if not GET or POST
    if ( ! (req.method == 'GET' || req.method == 'POST') ) {
      errMethod = { error: req.method + " request method is not supported. Use GET or POST." };
      console.log("ERROR: " + req.method + " request method is not supported.");
      res.write(JSON.stringify(errMethod));
      res.end();
      return;
    }

    // The incoming requesting string now contains a reference that should be removed
    req.url = req.url.replace('/futres/api/v1/query/','')
    // pass the request to elasticsearch
    var url = apiServerHost + req.url;
    console.log(url)
    req.pipe(request({
      uri  : url,
      // auth: { user: 'username', pass: 'password' }, // if needed
      headers: { 'accept-encoding': 'none' },
      rejectUnauthorized : false,
    }, function(err, resp, body) {
      if (err) {
        console.error("Elastic error:", err);
      } else {
        //console.log("Elastic status:", resp.statusCode);
        //console.log("Elastic body:", body); // 👈 log it
      }
    })).pipe(res);
  }
});

// Server Listen
app.listen(port, function () {
  console.log('App server is running on http://localhost:' + port);
  console.log('apiServerHost: ' + apiServerHost);
});
