# Arctos v2 deployment

The v2 query and download services use Lupinus through
`https://huxley.bnhm.berkeley.edu:1113/`. The v1 services retain their existing backend.

| Service | Entrypoint | Loopback port | Public route |
| --- | --- | --- | --- |
| Query | `arctos.api.v2.query.js` | `3623` | `/arctos/api/v2/query/` |
| Download | `arctos.api.v2.download.js` | `3624` | `/arctos/api/v2/download/` |

Ports 3623 and 3624 were checked against the listeners and PM2 processes on
biscicol.org. The v1 ports are 3621 and 3622. New services bind to `127.0.0.1`
behind nginx. If you change either v2 port, update its nginx `proxy_pass` as well.

## Environment

Use `/home/exouser/code/biscicol-server/.env` for both v2 services. Start with
[.env.example](../.env.example); the application loads this file directly with
Node.js 20.12 or newer. Variables supplied by the process environment take precedence.
The server runs Node.js 20.18.1.

```dotenv
ARCTOS_ELASTIC_URL=https://huxley.bnhm.berkeley.edu:1113/
ARCTOS_ELASTIC_INDEX=arctos
ARCTOS_ELASTIC_API_KEY=<encoded-read-only-api-key>
ARCTOS_QUERY_V2_PORT=3623
ARCTOS_DOWNLOAD_V2_PORT=3624
ARCTOS_V2_BIND_HOST=127.0.0.1
ARCTOS_ELASTIC_TIMEOUT_MS=30000
ARCTOS_V2_TMP_DIR=/home/exouser/data/tmp
```

Use a dedicated API key with `read` and `view_index_metadata` privileges on
`arctos` and `arctos-*`, and no cluster or write privileges. Both services supply
this key to Elasticsearch; callers never receive it. The query proxy replaces
incoming authorization headers with the configured credential.

Keep the importer's `elastic` password in `~/code/arctos_data/.env`. It is not
needed by these public services. The service `.env` should have mode `600` and
is ignored by Git. Commit only `.env.example`.

`BISCICOL_ENV_FILE` can select a different file. A dedicated read-only username
and password can alternatively be set with `ARCTOS_ELASTIC_USERNAME` and
`ARCTOS_ELASTIC_PASSWORD`. Do not put credentials in the backend URL.

The public proxy's HTTPS certificate verifies with the system trust store; no
custom CA file or SSH tunnel is required for API queries or downloads.
`ARCTOS_ELASTIC_CA_CERT` is available for a backend signed by a private CA.

## Start or restart v2 only

```bash
cd ~/code/biscicol-server
pm2 startOrRestart ecosystem.arctos-v2.config.js --update-env
pm2 save
```

Restart these two services after editing `.env`. The existing `start.sh` and
`restart.sh` also include them, alongside the other services.

The checked-in nginx configuration contains:

```nginx
location /arctos/api/v2/query {
    proxy_pass http://127.0.0.1:3623;
    include /etc/nginx/snippets/proxy-headers.conf;
}
location /arctos/api/v2/download {
    proxy_pass http://127.0.0.1:3624;
    proxy_read_timeout 3600s;
    proxy_buffering off;
    include /etc/nginx/snippets/proxy-headers.conf;
}
```

Validate nginx before reloading it. Enable the public routes after the import
finishes and the `arctos` alias points to the verified new index.

## Verify

```bash
npm run test:arctos-v2
curl 'http://127.0.0.1:3623/arctos/api/v2/query/arctos/_count'
curl --fail 'http://127.0.0.1:3624/arctos/api/v2/download/_search?limit=2' -o /tmp/arctos-v2.zip
unzip -l /tmp/arctos-v2.zip
```

The downloader requests exact hit totals, fetches 1,000 records per scroll page,
enforces the requested limit, and removes temporary archives after transfer.
`limit=0` downloads every match and requires enough temporary disk space for the
CSV and archive. Arrays and objects are represented as JSON in CSV cells.

The Huxley proxy currently blocks index creation, bulk indexing, and DELETE
requests. Query and scroll POST requests work. Download scroll cleanup is
best-effort; when DELETE is blocked, its context expires after 60 seconds.
The importer uses a separate authenticated SSH tunnel for writes.
