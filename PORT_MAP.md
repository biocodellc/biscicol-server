# Port Map

This file is the checked-in source of truth for port and route mappings in this repository.

Authority:

- deployed `biscicol.org` nginx config
- deployed `plantphenology.org` nginx config
- checked-in `start.sh` and `restart.sh`

## Public Route Map

| Public route | Local port | Service / target | Entrypoint or target | Notes |
| --- | --- | --- | --- | --- |
| `/ppo/api/v1/ppo` | `3000` | PPO ontology service | external to this repo | proxied by `biscicol.org` |
| `/ppo/api/v1/query` | `3001` | PPO query service | external to this repo | proxied by `biscicol.org` |
| `/ppo/api/v2/download` | `3007` | PPO download v2 | external to this repo | proxied by `biscicol.org` |
| `/ppo/api/v2/ppo` | `3008` | PPO ontology v2 | external to this repo | proxied by `biscicol.org` |
| `/ppo/api/v3/download` | `3011` | PPO download v3 | external to this repo | proxied by `biscicol.org` |
| `/futres/api/v1/query` | `3020` | FuTRES query | `futres.api.v1.query.js` | started by `start.sh` |
| `/futres/api/v2/download` | `3024` | FuTRES download v2 | `futres.api.v2.download.js` | started by `start.sh` |
| `/futres/api/v2/fovt` | `3025` | FuTRES FOVT lookup | `futres.api.v2.fovt.js` | started by `start.sh` |
| `/futres/api/v3/download` | `3026` | FuTRES download v3 | `futres.api.v3.download.js` | started by `start.sh` |
| `/amphibian_disease/api/v3/download` | `3027` | Amphibian disease download | `amphibian_disease.api.v3.download.js` | started by `start.sh` |
| `/api/v1/inaan` | `3028` | Inline NAAN service | `api.v1.inaan.js` | started by `start.sh` |
| `/herdlist/api/v1/csv` | `3300` | Herdlist CSV service | external to this repo | proxied by `biscicol.org` |
| `/dff/v1` | `3401` | DFF service | external to this repo | proxied by `biscicol.org` |
| `/killdeer/v2` | `3402` | Killdeer service | external to this repo | proxied by `biscicol.org` |
| `/phenobase/v1` | `3500` | Legacy Phenobase route | external target or separate app | proxied by `biscicol.org` |
| `/phenobase/api/v1/query` | `3601` | Phenobase query | `phenobase.api.v1.query.js` | started by `start.sh` |
| `/phenobase/api/v1/download` | `3602` | Phenobase download | `phenobase.api.v1.download.js` | started by `start.sh` |
| `/arctos/api/v1/query` | `3621` | Arctos query | `arctos.api.v1.query.js` | started by `start.sh` |
| `/arctos/api/v1/download` | `3622` | Arctos download | `arctos.api.v1.download.js` | started by `start.sh` |

## Legacy Redirect Map

These routes are still accepted and rewritten by `biscicol.org`.

| Legacy route | Rewritten to |
| --- | --- |
| `/api/v2/download` | `/ppo/api/v2/download` |
| `/api/v3/download` | `/ppo/api/v3/download` |
| `/api/v1/query` | `/ppo/api/v1/query` |
| `/api/v1/ppo` | `/ppo/api/v1/ppo` |
| `/api/v2/ppo` | `/ppo/api/v2/ppo` |
| `/futresapi/v1/query` | `/futres/api/v1/query` |
| `/futresapi/v2/download` | `/futres/api/v2/download` |
| `/futresapi/v3/download` | `/futres/api/v3/download` |
| `/futresapi/v2/fovt` | `/futres/api/v2/fovt` |
| `/adapi/v3/download` | `/amphibian_disease/api/v3/download` |
| `/api/v1/csv` | `/herdlist/api/v1/csv` |

## Other Nginx Mappings

| Route | Target |
| --- | --- |
| `/api/downloadable` | `/home/exouser/code/biscicol-server/data/downloadable` |
| `/herdlist` | `/home/exouser/code/csv-viewer/public` |
| `/geome-projects/<id>` | `https://geome-db.org/workbench/project-overview?projectId=<id>` |

## plantphenology.org Redirects

| Host route | Redirect target |
| --- | --- |
| `https://plantphenology.org/api...` | `https://biscicol.org/api...` |
| `https://plantphenology.org/futresapi...` | `https://biscicol.org/futresapi...` |

## PM2 Entrypoints In This Repo

| Port | Entrypoint |
| --- | --- |
| `3020` | `futres.api.v1.query.js` |
| `3024` | `futres.api.v2.download.js` |
| `3025` | `futres.api.v2.fovt.js` |
| `3026` | `futres.api.v3.download.js` |
| `3027` | `amphibian_disease.api.v3.download.js` |
| `3028` | `api.v1.inaan.js` |
| `3601` | `phenobase.api.v1.query.js` |
| `3602` | `phenobase.api.v1.download.js` |
| `3621` | `arctos.api.v1.query.js` |
| `3622` | `arctos.api.v1.download.js` |

## Notes

- The old `biscicol-server-port-map.xlsx` file was incomplete and stale relative to the deployed nginx config.
- PPO services are part of the public route map but are not owned by the Node entrypoints in this repository.
