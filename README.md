# About ppo-data-server

The PPO data server is a machine level interface to the database back-end storing all indexed results
from the [ppo-data-pipeline](https://github.com/biocodellc/ppo-data-pipeline).  Front end interfaces which call the ppo-data-server are the [global PPO data portal](https://github.com/biocodellc/ppo-data-interface) and the [rppo R package](https://github.com/biocodellc/rppo).

Query functions that return instance data run through a node.js reverse proxy to the elasticsearch database service, which is run
on a different server, secured by an opening through a firewall via a dedicated port.  Query functions that return trait data elements from the Plant Phenology Ontology utilize the [rdflib.js](https://github.com/linkeddata/rdflib.js/) library for parsing the ontology, and cache elements on the server to be returned for requests.  A cronjob is utilized to update cache results once per night so any changes in the PPO itself will take up to 24 hours to register.  The purpose of the cacheing is to improve speed of responses.

The URL endpoint prefix for all services is at `https://www.plantphenology.org/api/`.  Following are the services that live below this endpoint.  Please note the versions of the service endpoints below which contain different current versions, indicated by `v1` or `v2`.  It is important to reference the correct version for each service to return the documented responses:

FuTRES Endpoints
  *  [futresapi/v2/download_futres_proxy](docs/download_futres_proxy.md) Query the Futres data store download_futres_proxy.md
  *  [futresapi/v1/query](docs/es_futres_proxy.md) Query the Futres data store 
  *  [futresapi/v2/fovt](docs/futres_ontology_proxy.md) Lookup terms from the FOVT ontology

Plant Phenology Endpoints
  *  [api/v1/query](docs/es_proxy.md) Query the PPO data store 
  *  [api/v2/download](docs/download_proxy.md) Downlaod results as a package from data store
  *  [api/v2/ppo](docs/ontology_proxy.md)  Lookup terms from the PPO ontology


