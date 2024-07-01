# About biscicol-server

biscicol-server is an API endpoint for accessing annotated biodiversity trait data.  Query functions return instance data run through a node.js reverse proxy to an elasticsearch database service.  The URL endpoint prefix for all services is at `https://biscicol.org/`  Following are the services that live below this endpoint.  Please note the versions of the service endpoints below which contain different current versions, indicated by `v1` or `v2`.  It is important to reference the correct version for each service to return the documented responses:

## FuTRES Endpoints
The [fovt-data-pipeline](https://github.com/futres/fovt-data-pipeline) processes data for the [Futres query interface](https://futres-data-interface.netlify.app/) and also accessible using the [rfovt package](https://github.com/futres/rfovt).
  *  [https://biscicol.org/futres/api/v1/query](docs/futres_query.md) Query the Futres data store 
  *  [https://biscicol.org/futres/api/v3/download](docs/futres_download.md) Download results as a package from data store
  *  [https://biscicol.org/futres/api/v2/fovt](docs/futres_ontology.md) Lookup terms from the FOVT ontology

## Phenobase Endpoint
  *  [https://biscicol.org/phenobase/api/v1/query](docs/phenobase_query.md) Query the PPO data store 

## Plant Phenology Ontology Specific Endpoints
The [ppo-data-pipeline](https://github.com/biocodellc/ppo-data-pipeline) processes data for the [PPO data interface](https://plantphenology.org/) and also accessible using the [rppo package](https://github.com/biocodellc/rppo)
  *  [https://biscicol.org/ppo/api/v1/query](docs/ppo_query.md) Query the PPO data store 
  *  [https://biscicol.org/ppo/api/v3/download](docs/ppo_download.md) Downlaod results as a package from data store
  *  [https://biscicol.org/ppo/api/v2/ppo](docs/ppo_ontology.md)  Lookup terms from the PPO ontology

## Amphibian Disease Specific Endpoints
  *  [https://biscicol.org/amphibian_disease/api/v3/download](docs/amphibian_disease_download.md) Download results as a package from Data Store

## Generic Endpoints
  *  [https://biscicol.org/api/downloadable](https://biscicol.org/api/downloadable/)  Directory containing a single zip file of ALL FuTRES data
  *  [https://biscicol.org/api/v1/inaan/ark:/92250/{inline_concept}?info](https://biscicol.org/api/v1/inaan/ark:/92250/oven_temperature?info) Inline NAAN servie
  *  https://biscicol.org/geome-projects Redirect service for GEOME minted identifiers (IN DEVELOPMENT)


.
