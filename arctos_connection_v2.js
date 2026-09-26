// Elasticsearch REST calls for v2, independent of the legacy v1 client.
var http = require('http');
var https = require('https');
var elasticConfig = require('./config/elasticsearch');

function request(method, path, body, signal, timeout) {
  return new Promise(function (resolve, reject) {
    var data = body === undefined ? null : Buffer.from(JSON.stringify(body));
    var headers = data ? { 'content-type': 'application/json', 'content-length': data.length } : {};
    var options = elasticConfig.requestOptions(path, method, headers);
    options.signal = signal;
    var transport = options.protocol === 'https:' ? https : http;
    var req = transport.request(options, function (res) {
      var chunks = [];
      res.on('data', function (chunk) { chunks.push(chunk); });
      res.on('error', reject);
      res.on('end', function () {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          var error = new Error('Elasticsearch returned HTTP ' + res.statusCode);
          error.statusCode = res.statusCode;
          return reject(error);
        }
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (error) {
          reject(new Error('Elasticsearch returned invalid JSON.'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeout || elasticConfig.timeout(), function () { req.destroy(new Error('Elasticsearch request timed out.')); });
    req.end(data);
  });
}

module.exports = {
  search: function (query, size, signal) {
    return request('POST', encodeURIComponent(elasticConfig.index()) + '/_search?scroll=60s', {
      size: size,
      track_total_hits: true,
      sort: ['_doc'],
      query: query && query.trim() ? { query_string: { query: query } } : { match_all: {} },
    }, signal);
  },
  scroll: function (scrollId, signal) {
    return request('POST', '_search/scroll', { scroll_id: scrollId, scroll: '60s' }, signal);
  },
  clearScroll: function (scrollId) {
    return request('DELETE', '_search/scroll', { scroll_id: [scrollId] }, undefined, 5000);
  },
};
