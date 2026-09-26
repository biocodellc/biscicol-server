var http = require('http');
var https = require('https');
var express = require('express');
var cors = require('cors');
var elasticConfig = require('./config/elasticsearch');
var services = require('./config/services');

var app = express();
var routePrefix = '/arctos/api/v2/query';

app.use(cors({ origin: '*' }));
app.use(function (req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.set('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: req.method + ' request method is not supported. Use GET or POST.' });
  }
  var relativePath = req.url;
  if (relativePath === routePrefix || relativePath.startsWith(routePrefix + '/') || relativePath.startsWith(routePrefix + '?')) {
    relativePath = relativePath.slice(routePrefix.length);
  }
  var headers = { 'accept-encoding': 'identity' };
  ['content-type', 'content-length'].forEach(function (name) {
    if (req.headers[name]) headers[name] = req.headers[name];
  });
  var options = elasticConfig.requestOptions(relativePath, req.method, headers);
  var transport = options.protocol === 'https:' ? https : http;
  var upstream = transport.request(options, function (response) {
    res.status(response.statusCode);
    ['content-type', 'content-encoding', 'content-length'].forEach(function (name) {
      if (response.headers[name]) res.setHeader(name, response.headers[name]);
    });
    response.on('error', function () { res.destroy(); });
    response.pipe(res);
  });
  upstream.setTimeout(elasticConfig.timeout(), function () { upstream.destroy(new Error('Upstream timeout')); });
  upstream.on('error', function () {
    if (!res.headersSent && !res.destroyed) res.status(502).json({ error: 'elasticsearch request failed' });
    else res.destroy();
  });
  req.on('aborted', function () { upstream.destroy(); });
  res.on('close', function () { if (!res.writableEnded) upstream.destroy(); });
  req.pipe(upstream);
});

if (require.main === module) {
  elasticConfig.authorization();
  var port = elasticConfig.port('query', services.arctosQueryV2.port);
  app.listen(port, elasticConfig.bindHost(), function () {
    console.log('Arctos v2 query listening on ' + elasticConfig.bindHost() + ':' + port);
    console.log('Elasticsearch: ' + elasticConfig.arctosV2Url());
  });
}

module.exports = app;
