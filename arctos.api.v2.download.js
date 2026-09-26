var path = require('path');
var os = require('os');
var fs = require('fs-extra');
var express = require('express');
var cors = require('cors');
var archiver = require('archiver');
var csvWriter = require('csv-write-stream');
var once = require('events').once;
var pipeline = require('stream/promises').pipeline;
var elasticConfig = require('./config/elasticsearch');
var services = require('./config/services');
var client = require('./arctos_connection_v2');

var app = express();
var readmeName = 'ARCTOS_README.txt';
var policyName = 'citation_and_data_use_policies.txt';
var archiveName = 'arctos_download.zip';

function parseLimit(value) {
  if (value === undefined) return 100000;
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
    throw new Error('limit must be a non-negative integer');
  }
  return Number(value);
}

async function createArchive(query, limit, directory, signal) {
  var contentDir = path.join(directory, 'content');
  await fs.ensureDir(contentDir);
  var scrollId;
  var writer;
  var writeComplete;
  var count = 0;
  var total = 0;
  try {
    var response = await client.search(query, limit === 0 ? 1000 : Math.min(limit, 1000), signal);
    var hitsTotal = response.hits.total;
    total = typeof hitsTotal === 'number' ? hitsTotal : hitsTotal.value;
    while (true) {
      scrollId = response._scroll_id || scrollId;
      var hits = response.hits.hits;
      if (!hits.length) break;
      if (!writer) {
        var headers = Array.from(new Set(Object.keys(hits[0]._source).concat(['type', '_csv_numeric_originals'])));
        writer = csvWriter({ headers: headers });
        writeComplete = pipeline(writer, fs.createWriteStream(path.join(contentDir, 'data.csv')));
        writeComplete.catch(function () {}); // Observed below after ending/destroying the writer.
      }
      for (var hit of hits) {
        if (signal.aborted) throw new Error('Download cancelled');
        if (limit > 0 && count >= limit) break;
        var record = {};
        Object.keys(hit._source).forEach(function (key) {
          var value = hit._source[key];
          record[key] = value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
        });
        if (!writer.write(record)) await once(writer, 'drain');
        count++;
      }
      if ((limit > 0 && count >= limit) || count >= total) break;
      response = await client.scroll(scrollId, signal);
    }
    if (writer) {
      writer.end();
      await writeComplete;
    }
  } catch (error) {
    if (writer) {
      writer.destroy(error);
      await writeComplete.catch(function () {});
    }
    throw error;
  } finally {
    if (scrollId) {
      await client.clearScroll(scrollId).catch(function (error) {
        // Huxley's proxy currently blocks DELETE; the 60-second context expiry still applies.
        console.warn('Scroll cleanup returned ' + (error.statusCode || 'a connection error') + '; context will expire.');
      });
    }
  }
  if (!count) return null;
  await fs.copy(path.join(__dirname, 'arctos_data', policyName), path.join(contentDir, policyName));
  await fs.copy(path.join(__dirname, 'arctos_data', readmeName), path.join(contentDir, readmeName));
  var metadata = '\ndata file = data.csv\ndate query ran = ' + new Date().toISOString();
  metadata += '\nquery = ' + (query || '*') + '\nfields returned = all\n';
  if (limit) metadata += 'user specified limit = ' + limit + '\n';
  metadata += 'total results possible = ' + total.toLocaleString() + '\n';
  metadata += 'total results returned = ' + count.toLocaleString() + '\n';
  await fs.appendFile(path.join(contentDir, readmeName), metadata);
  var archivePath = path.join(directory, archiveName);
  var archive = archiver('zip', { zlib: { level: 6 } });
  var archived = pipeline(archive, fs.createWriteStream(archivePath));
  archived.catch(function () {});
  archive.directory(contentDir, false);
  try {
    await archive.finalize();
    await archived;
  } catch (error) {
    archive.destroy(error);
    await archived.catch(function () {});
    throw error;
  }
  return archivePath;
}

app.use(cors({ origin: '*' }));
app.use(async function (req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Use GET or POST.' });
  var limit;
  try {
    limit = parseLimit(req.query.limit);
    if (req.query.q !== undefined && typeof req.query.q !== 'string') throw new Error('q must be a string');
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  var controller = new AbortController();
  res.on('close', function () { if (!res.writableEnded) controller.abort(); });
  var directory;
  try {
    var tempRoot = process.env.ARCTOS_V2_TMP_DIR || os.tmpdir();
    await fs.ensureDir(tempRoot);
    directory = await fs.mkdtemp(path.join(tempRoot, 'arctos-v2-'));
    var archivePath = await createArchive(req.query.q, limit, directory, controller.signal);
    if (controller.signal.aborted) return await fs.remove(directory);
    if (!archivePath) {
      await fs.remove(directory);
      return res.status(204).end();
    }
    res.download(archivePath, archiveName, function (error) {
      fs.remove(directory).catch(function (cleanupError) { console.error('Download cleanup failed:', cleanupError.code); });
      if (error && !res.headersSent && !res.destroyed) res.status(500).end();
    });
  } catch (error) {
    if (directory) await fs.remove(directory).catch(function () {});
    console.error('Arctos v2 download failed:', error.message);
    if (!res.headersSent && !res.destroyed) res.status(502).json({ error: 'search or download failed' });
  }
});

if (require.main === module) {
  elasticConfig.authorization();
  var port = elasticConfig.port('download', services.arctosDownloadV2.port);
  app.listen(port, elasticConfig.bindHost(), function () {
    console.log('Arctos v2 download listening on ' + elasticConfig.bindHost() + ':' + port);
    console.log('Elasticsearch: ' + elasticConfig.arctosV2Url() + ' index=' + elasticConfig.index());
  });
}

module.exports = app;
