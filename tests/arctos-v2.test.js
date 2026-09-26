var test = require('node:test');
var assert = require('node:assert/strict');
var http = require('node:http');
var fs = require('node:fs/promises');
var os = require('node:os');
var path = require('node:path');
var JSZip = require('jszip');

test('Arctos v2 authenticated proxy and paginated downloads', async function (t) {
  var observed = [];
  var scenario = { total: 1505, position: 0, pageSize: 1000, error: false };
  var backend = http.createServer(async function (req, res) {
    var chunks = [];
    for await (var chunk of req) chunks.push(chunk);
    var raw = Buffer.concat(chunks).toString();
    var body = raw ? JSON.parse(raw) : {};
    observed.push({ method: req.method, url: req.url, auth: req.headers.authorization, body: body });
    res.setHeader('content-type', 'application/json');
    if (req.url.includes('proxy-test')) return res.end(JSON.stringify({ method: req.method, body: body }));
    if (req.method === 'DELETE') return res.end(JSON.stringify({ succeeded: true }));
    if (scenario.error) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'test backend error' }));
    }
    if (req.url.startsWith('/arctos-test/_search?')) {
      assert.equal(body.track_total_hits, true);
      scenario.position = 0;
      scenario.pageSize = body.size;
    }
    var end = Math.min(scenario.position + scenario.pageSize, scenario.total);
    var hits = [];
    for (var i = scenario.position; i < end; i++) hits.push({ _source: { id: i, scientific_name: 'Specimen ' + i } });
    scenario.position = end;
    res.end(JSON.stringify({ _scroll_id: 'test-scroll', hits: { total: { value: scenario.total, relation: 'eq' }, hits: hits } }));
  });
  await new Promise(function (resolve) { backend.listen(0, '127.0.0.1', resolve); });
  var temp = await fs.mkdtemp(path.join(os.tmpdir(), 'arctos-v2-test-'));
  process.env.ARCTOS_ELASTIC_URL = 'http://127.0.0.1:' + backend.address().port;
  process.env.ARCTOS_ELASTIC_API_KEY = 'test-only-key';
  process.env.ARCTOS_ELASTIC_INDEX = 'arctos-test';
  process.env.ARCTOS_V2_TMP_DIR = temp;
  var queryApp = require('../arctos.api.v2.query');
  var downloadApp = require('../arctos.api.v2.download');
  var query = queryApp.listen(0, '127.0.0.1');
  var download = downloadApp.listen(0, '127.0.0.1');
  await Promise.all([query, download].map(function (server) {
    return server.listening ? Promise.resolve() : new Promise(function (resolve) { server.once('listening', resolve); });
  }));
  t.after(async function () {
    await Promise.all([query, download, backend].map(function (server) {
      server.closeAllConnections();
      return new Promise(function (resolve) { server.close(resolve); });
    }));
    await fs.rm(temp, { recursive: true, force: true });
  });
  var queryUrl = 'http://127.0.0.1:' + query.address().port + '/arctos/api/v2/query';
  var downloadUrl = 'http://127.0.0.1:' + download.address().port + '/arctos/api/v2/download/_search';

  await t.test('GET/POST preserve queries and bodies and use server credentials', async function () {
    var r = await fetch(queryUrl + '/proxy-test?q=fish', { headers: { authorization: 'Bearer client-supplied' } });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('access-control-allow-origin'), '*');
    assert.equal(observed.at(-1).url, '/proxy-test?q=fish');
    assert.equal(observed.at(-1).auth, 'ApiKey test-only-key');
    r = await fetch(queryUrl + '/proxy-test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: { match_all: {} } }) });
    assert.deepEqual((await r.json()).body, { query: { match_all: {} } });
    assert.equal((await fetch(queryUrl + '/proxy-test', { method: 'DELETE' })).status, 405);
    var config = require('../config/elasticsearch');
    assert.equal(config.requestOptions('//elsewhere.example/proxy-test', 'GET').hostname, '127.0.0.1');
    assert.equal(config.requestOptions('/proxy-test', 'GET').rejectUnauthorized, true);
  });

  async function downloadRows(limit) {
    var r = await fetch(downloadUrl + '?limit=' + limit);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-disposition'), /arctos_download.zip/);
    var zip = await JSZip.loadAsync(await r.arrayBuffer());
    var csv = await zip.file('data.csv').async('string');
    var metadata = await zip.file('ARCTOS_README.txt').async('string');
    assert.ok(zip.file('citation_and_data_use_policies.txt'));
    return { rows: csv.trimEnd().split('\n').length - 1, metadata: metadata };
  }

  await t.test('exact record limit across multiple scroll pages', async function () {
    var result = await downloadRows(1501);
    assert.equal(result.rows, 1501);
    assert.match(result.metadata, /total results returned = 1,501/);
    assert.match(result.metadata, /total results possible = 1,505/);
  });

  await t.test('unlimited download continues beyond 10000 records', async function () {
    scenario.total = 10005;
    assert.equal((await downloadRows(0)).rows, 10005);
  });

  await t.test('empty searches, invalid limits, and upstream errors', async function () {
    scenario.total = 0;
    assert.equal((await fetch(downloadUrl + '?limit=2')).status, 204);
    assert.equal((await fetch(downloadUrl + '?limit=-1')).status, 400);
    scenario.error = true;
    assert.equal((await fetch(downloadUrl + '?limit=2')).status, 502);
    for (var i = 0; i < 50 && (await fs.readdir(temp)).length; i++) {
      await new Promise(function (resolve) { setTimeout(resolve, 10); });
    }
    assert.deepEqual(await fs.readdir(temp), []);
  });
});
