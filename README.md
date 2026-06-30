# About biscicol-server

biscicol-server is an API endpoint for accessing annotated biodiversity trait data.  Query functions return instance data run through a node.js reverse proxy to an elasticsearch database service.  The URL endpoint prefix for all services is at `https://biscicol.org/`  Following are the services that live below this endpoint.  Please note the versions of the service endpoints below which contain different current versions, indicated by `v1` or `v2`.  It is important to reference the correct version for each service to return the documented responses:

## Repository Notes

- The deployed port and route map is documented in [PORT_MAP.md](PORT_MAP.md).
- The checked-in runtime contract is documented in [docs/current_service_contract.md](docs/current_service_contract.md).
- A no-break cleanup sequence is documented in [docs/repository_cleanup_plan.md](docs/repository_cleanup_plan.md).
- PPO endpoints listed below are part of the public API surface, but the checked-in live service entrypoints for those routes are not all owned by this repository.

## Phenobase Endpoint
  *  [https://biscicol.org/phenobase/api/v1/query](docs/phenobase_query.md) Query the PPO data store 

## Arctos Endpoints
  *  [https://biscicol.org/arctos/api/v1/query](docs/arctos_query.md) Query the Arctos data store
  *  [https://biscicol.org/arctos/api/v1/download](docs/arctos_download.md) Download Arctos query results as a zip package

## Plant Phenology Ontology Specific Endpoints
The [ppo-data-pipeline](https://github.com/biocodellc/ppo-data-pipeline) processes data for the [PPO data interface](https://plantphenology.org/) and also accessible using the [rppo package](https://github.com/biocodellc/rppo)
  *  [https://biscicol.org/ppo/api/v1/query](docs/ppo_query.md) Query the PPO data store 
  *  [https://biscicol.org/ppo/api/v3/download](docs/ppo_download.md) Downlaod results as a package from data store
  *  [https://biscicol.org/ppo/api/v2/ppo](docs/ppo_ontology.md)  Lookup terms from the PPO ontology

## Amphibian Disease Specific Endpoints
  *  [https://biscicol.org/amphibian_disease/api/v3/download](docs/amphibian_disease_download.md) Download results as a package from Data Store

## Generic Endpoints
  *  [https://biscicol.org/api/v1/inaan/ark:/92250/{inline_concept}?info](https://biscicol.org/api/v1/inaan/ark:/92250/oven_temperature?info) Inline NAAN servie
  *  https://biscicol.org/geome-projects Redirect service for GEOME minted identifiers (IN DEVELOPMENT)


.
