# Repository Cleanup Plan

This plan is scoped to cleanup only. The goal is to make the repository easier to operate and change without changing how API endpoints are exposed or managed.

## Non-negotiable guardrails

- Keep all public URLs unchanged.
- Keep all PM2 entry filenames unchanged for the first refactor pass.
- Keep nginx route mappings unchanged until equivalent smoke checks are in place.
- Do not merge service behavior changes with structural cleanup.

## What should change first

### 1. Freeze the current contract

Use [current_service_contract.md](./current_service_contract.md) as the source of truth for:

- public route prefixes
- local ports
- entry files
- dataset ownership
- known deployment mismatches

Before runtime refactors, add simple smoke checks for:

- query endpoints returning a response for `GET`
- query endpoints accepting `POST`
- download endpoints returning an attachment
- ontology endpoints returning JSON
- `api.v1.inaan.js` responding on its existing path shape

### 2. Separate runtime code from generated data and operations docs

The repository currently mixes:

- deployable service entrypoints
- generated JSON data
- one-off generator scripts
- nginx config
- operational notes

Recommended top-level intent:

- `src/` for shared runtime modules
- root entry files kept temporarily as wrappers for PM2 compatibility
- `docs/` for public and operational documentation
- `scripts/` for generation and maintenance scripts
- dataset directories kept in place until runtime extraction is complete

### 3. Extract shared query proxy logic

First shared module candidate:

- `src/lib/create-query-proxy.js`

Inputs should be configuration only:

- `routePrefix`
- `port`
- `elasticUrl`
- `allowAuth`
- `authConfig`

Expected outcome:

- `futres.api.v1.query.js`
- `phenobase.api.v1.query.js`
- `phenobase.api.v2.query.js`
- `arctos.api.v1.query.js`

become thin wrappers that pass configuration into the shared module.

This is low-risk because the public route contract is outside the files and already defined by nginx.

### 4. Extract shared download service logic

Second shared module candidate:

- `src/lib/create-download-service.js`

Inputs should include:

- `datasetName`
- `port`
- `indexName`
- `tempRoot`
- `archiveFormat`
- `returnedArchiveFile`
- `metadataDir`
- `metadataFile`
- `citationFile`
- `fieldMapper`

Expected outcome:

- keep the existing dataset-specific wrappers
- centralize scroll, CSV writing, archiving, and cleanup behavior
- isolate dataset-specific field selection and metadata wiring

### 5. Centralize service configuration

Create one config module for values that are currently scattered:

- ports
- route prefixes
- Elasticsearch hosts
- Elasticsearch index names
- temp directories
- archive filenames
- metadata filenames

This is where the current `phenobase` port mismatch should be made explicit before any behavior change is attempted.

### 6. Clean up scripts and naming

The following should be normalized after runtime extraction:

- rename JavaScript files with `.sh` suffix under `scripts/`
- separate generator scripts from server entrypoints
- remove unused dependencies from `package.json`
- add meaningful npm scripts for smoke checks and docs checks

### 7. Rewrite documentation around actual ownership

The repo needs three kinds of docs:

- `architecture.md`: what this repository owns and how requests flow
- `endpoints.md`: public API inventory and dataset mapping
- `operations.md`: PM2, nginx, generated files, and restart procedure

The current README should stay short and point to those docs.

## Suggested target structure

```text
src/
  config/
    services.js
  lib/
    create-query-proxy.js
    create-download-service.js
    elasticsearch-client.js
    http-helpers.js
  datasets/
    futres.js
    phenobase.js
    arctos.js
    amphibian-disease.js

docs/
  current_service_contract.md
  architecture.md
  endpoints.md
  operations.md
  repository_cleanup_plan.md
```

## Safe implementation order

1. Add contract docs and smoke checks.
2. Extract shared query proxy module with no external behavior changes.
3. Extract shared download module with no external behavior changes.
4. Centralize config values.
5. Rewrite README and operational docs.
6. Rename scripts and reduce top-level clutter.

## Things not to do in the first pass

- Do not change nginx route prefixes.
- Do not collapse everything into one Express app immediately.
- Do not rename PM2 entry files immediately.
- Do not change archive formats or filenames.
- Do not “fix” port mismatches unless deployment config is updated in the same change.
