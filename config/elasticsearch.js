var fs = require('fs');
var path = require('path');

var envFile = process.env.BISCICOL_ENV_FILE || path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  if (typeof process.loadEnvFile !== 'function') {
    throw new Error('Arctos v2 requires Node.js 20.12 or newer to load .env files.');
  }
  process.loadEnvFile(envFile);
} else if (process.env.BISCICOL_ENV_FILE) {
  throw new Error('BISCICOL_ENV_FILE does not exist.');
}

var DEFAULT_ARCTOS_V2_ELASTIC_URL = 'https://huxley.bnhm.berkeley.edu:1113/';

function normalizeElasticUrl(value) {
  var url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('ARCTOS_ELASTIC_URL must be an HTTP(S) URL without credentials, query, or fragment.');
  }
  return url.toString().replace(/\/+$/, '') + '/';
}

function arctosV2Url() {
  return normalizeElasticUrl(process.env.ARCTOS_ELASTIC_URL || DEFAULT_ARCTOS_V2_ELASTIC_URL);
}

function authorization() {
  if (process.env.ARCTOS_ELASTIC_API_KEY) return 'ApiKey ' + process.env.ARCTOS_ELASTIC_API_KEY;
  if (process.env.ARCTOS_ELASTIC_USERNAME && process.env.ARCTOS_ELASTIC_PASSWORD) {
    return 'Basic ' + Buffer.from(process.env.ARCTOS_ELASTIC_USERNAME + ':' + process.env.ARCTOS_ELASTIC_PASSWORD).toString('base64');
  }
  throw new Error('Set ARCTOS_ELASTIC_API_KEY, or ARCTOS_ELASTIC_USERNAME and ARCTOS_ELASTIC_PASSWORD.');
}

function positiveInteger(value, fallback, maximum) {
  var parsed = value === undefined || value === '' ? fallback : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || (maximum && parsed > maximum)) {
    throw new Error('Invalid Arctos v2 numeric configuration.');
  }
  return parsed;
}

function requestOptions(relativePath, method, headers) {
  var url = new URL(arctosV2Url());
  var options = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    // Caller paths cannot change the destination host or authentication.
    path: url.pathname + relativePath.replace(/^\/+/, ''),
    method: method,
    headers: Object.assign({}, headers, { authorization: authorization(), accept: 'application/json' }),
    rejectUnauthorized: true,
  };
  if (process.env.ARCTOS_ELASTIC_CA_CERT) {
    options.ca = fs.readFileSync(path.resolve(path.dirname(envFile), process.env.ARCTOS_ELASTIC_CA_CERT));
  }
  return options;
}

module.exports = {
  DEFAULT_ARCTOS_V2_ELASTIC_URL: DEFAULT_ARCTOS_V2_ELASTIC_URL,
  arctosV2Url: arctosV2Url,
  normalizeElasticUrl: normalizeElasticUrl,
  authorization: authorization,
  requestOptions: requestOptions,
  index: function () { return process.env.ARCTOS_ELASTIC_INDEX || 'arctos'; },
  bindHost: function () { return process.env.ARCTOS_V2_BIND_HOST || '127.0.0.1'; },
  port: function (kind, fallback) {
    return positiveInteger(process.env.PORT || process.env['ARCTOS_' + kind.toUpperCase() + '_V2_PORT'], fallback, 65535);
  },
  timeout: function () { return positiveInteger(process.env.ARCTOS_ELASTIC_TIMEOUT_MS, 30000); },
};
