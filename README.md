# About biscicol-server

biscicol-server is a machine level interface to reasoned trait data that has been processed using the [ontology-data-pipeline](https://github.com/biocodellc/ontology-data-pipeline) (see, for example, [ppo-data-pipeline](https://github.com/biocodellc/ppo-data-pipeline) and [fovt-data-pipeline](https://github.com/futres/fovt-data-pipeline)).  The API here serves user interfaces for FuTRES, PPO, and Amphibian Disease portals as well as two R packages: [rppo](https://github.com/biocodellc/rppo) and [rfovt](https://github.com/futres/rfovt).

Query functions return instance data run through a node.js reverse proxy to an elasticsearch database service.  Query functions returning OWL class definitions utilize the [rdflib.js](https://github.com/linkeddata/rdflib.js/) library for parsing the ontology, and cache elements on the server to be returned for requests.  A cronjob is utilized to update cache results once per night so any changes in the PPO itself will take up to 24 hours to register.  The purpose of the cacheing is to improve speed of responses.

The URL endpoint prefix for all services is at `https://biscicol.org/`  Following are the services that live below this endpoint.  Please note the versions of the service endpoints below which contain different current versions, indicated by `v1` or `v2`.  It is important to reference the correct version for each service to return the documented responses:

FuTRES Endpoints
  *  [futres/api/v1/query](docs/futres_query.md) Query the Futres data store 
  *  [futres/api/v3/download](docs/futres_download.md) Download results as a package from data store
  *  [futres/api/v2/fovt](docs/futres_ontology.md) Lookup terms from the FOVT ontology

Plant Phenology Ontology Specific Endpoints
  *  [/ppo/api/v1/query](docs/ppo_query.md) Query the PPO data store 
  *  [/ppo/api/v3/download](docs/ppo_download.md) Downlaod results as a package from data store
  *  [/ppo/api/v2/ppo](docs/ppo_ontology.md)  Lookup terms from the PPO ontology

Amphibian Disease Specific Endpoints
  *  [/amphibian_disease/api/v3/download](docs/amphibian_disease_download.md) Download results as a package from Data Store

Generic Endpoints
  *  [/api/downloadable](https://biscicol.org/api/downloadable/)  Directory containing a single zip file of ALL FuTRES data
  *  [/api/v1/inaan/ark:/92250/{inline_concept}?info](https://biscicol.org/api/v1/inaan/ark:/92250/oven_temperature?info) Inline NAAN servie
  *  /geome-projects Redirect service for GEOME minted identifiers (in development)


.
