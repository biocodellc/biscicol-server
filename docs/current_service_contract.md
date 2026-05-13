# Current Service Contract

This document freezes the API-facing contract represented by the repository as it exists today. It is intended to be the safety boundary for cleanup work.

Primary route and port authority lives in [PORT_MAP.md](../PORT_MAP.md).

## Rules for cleanup

- Do not change public URLs.
- Do not change PM2 entrypoint filenames until deployment scripts are updated in the same release.
- Do not change default ports until nginx and PM2 mappings are updated together.
- Do not change download archive filenames or bundled metadata filenames without explicit API approval.

## Public route to local service map

The table below is derived from the deployed nginx config, [start.sh](../start.sh), [restart.sh](../restart.sh), and the checked-in nginx snapshots under [sites-enabled](../sites-enabled).

| Public route | Local port in nginx | Entry file in this repo | Default port in file | Notes |
| --- | --- | --- | --- | --- |
| `/futres/api/v1/query` | `3020` | `futres.api.v1.query.js` | `3020` | Query proxy to Elasticsearch |
| `/futres/api/v2/download` | `3024` | `futres.api.v2.download.js` | `3024` | Legacy tar.gz download service |
| `/futres/api/v2/fovt` | `3025` | `futres.api.v2.fovt.js` | `3025` | Serves prebuilt ontology JSON files |
| `/futres/api/v3/download` | `3026` | `futres.api.v3.download.js` | `3026` | Zip download service |
| `/amphibian_disease/api/v3/download` | `3027` | `amphibian_disease.api.v3.download.js` | `3027` | Zip download service |
| `/api/v1/inaan` | `3028` | `api.v1.inaan.js` | `3028` | Plain Node HTTP server, not Express |
| `/phenobase/v1` | `3500` | not in this repo | n/a | Legacy Phenobase route |
| `/phenobase/api/v1/query` | `3601` | `phenobase.api.v1.query.js` | `3601` | Query proxy |
| `/phenobase/api/v1/download` | `3602` | `phenobase.api.v1.download.js` | `3602` | Download service |
| `/arctos/api/v1/query` | `3621` | `arctos.api.v1.query.js` | `3621` | Query proxy |
| `/arctos/api/v1/download` | `3622` | `arctos.api.v1.download.js` | `3622` | Download service |
| `/ppo/api/v1/query` | `3001` | not in this repo | n/a | Repo contains docs, not the live service entrypoint |
| `/ppo/api/v1/ppo` | `3000` | not in this repo | n/a | Repo contains ontology generation scripts only |
| `/ppo/api/v2/ppo` | `3008` | not in this repo | n/a | External to this repo |
| `/ppo/api/v2/download` | `3007` | not in this repo | n/a | External to this repo |
| `/ppo/api/v3/download` | `3011` | not in this repo | n/a | External to this repo |

## PM2-managed entry files in this repo

These are started directly by [start.sh](../start.sh).

| Entry file | Service type | Dataset |
| --- | --- | --- |
| `futres.api.v1.query.js` | query proxy | FuTRES |
| `futres.api.v2.fovt.js` | ontology file server | FuTRES |
| `futres.api.v2.download.js` | download generator | FuTRES |
| `futres.api.v3.download.js` | download generator | FuTRES |
| `amphibian_disease.api.v3.download.js` | download generator | Amphibian Disease |
| `api.v1.inaan.js` | inline identifier service | Generic |
| `phenobase.api.v1.query.js` | query proxy | Phenobase |
| `phenobase.api.v1.download.js` | download generator | Phenobase |
| `arctos.api.v1.query.js` | query proxy | Arctos |
| `arctos.api.v1.download.js` | download generator | Arctos |

## Internal service families

### Query proxies

These services are near-duplicates and are the safest first extraction target.

- `futres.api.v1.query.js`
- `phenobase.api.v1.query.js`
- `phenobase.api.v2.query.js`
- `arctos.api.v1.query.js`

Shared behavior today:

- Express + CORS wrapper
- only `GET` and `POST` are accepted
- incoming route prefix is stripped from `req.url`
- remaining request is proxied to Elasticsearch with `request`
- gzip is disabled via `accept-encoding: none`

Per-service differences today:

- route prefix to strip
- default port
- Elasticsearch host formatting
- auth block present in some files and absent in others

### Download generators

These services also share one implementation pattern.

- `futres.api.v2.download.js`
- `futres.api.v3.download.js`
- `phenobase.api.v1.download.js`
- `arctos.api.v1.download.js`
- `amphibian_disease.api.v3.download.js`

Shared behavior today:

- execute an Elasticsearch scroll query
- stream results to CSV
- copy metadata and citation files into a temp directory
- archive the directory
- return the archive as a download

Per-service differences today:

- Elasticsearch index name
- selected CSV fields
- temp directory location
- archive format and filename
- metadata source directory and filenames

### Ontology and generated data assets

- `futres.api.v2.fovt.js` serves `futres_data/all.json` and `futres_data/all_short.json`
- `scripts/api.ontology.sh`, `scripts/srcapi.ontology.sh`, and `scripts/futresapi.ontology.sh` are JavaScript source files despite their `.sh` extension
- generated data directories include `data/`, `futres_data/`, `phenobase_data/`, `arctos_data/`, `ad_data/`, and `src_data/`

## Known inconsistencies to preserve carefully during refactor

- `phenobase.api.v2.query.js` exists in the repo but is not started by `start.sh`.
- The old `biscicol-server-port-map.xlsx` spreadsheet was incomplete and stale relative to the deployed nginx config.
- `README.md` and `docs/installation.md` describe PPO-centric routing and older deployment assumptions that do not match the current checked-in service layout.
- Hardcoded infrastructure values exist in runtime files, including Elasticsearch hosts, temp paths, and filesystem paths.

## Recommended invariants for phase 2

If code cleanup starts, preserve these values as configuration rather than changing them in place:

- public route prefixes
- entry filenames used by PM2
- default ports
- Elasticsearch index names
- returned archive filenames
- metadata and citation filenames
