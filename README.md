# About ppo-data-server

The PPO data server is a machine level interface to the elasticsearch database back-end storing all indexed results
from the [ppo-data-pipeline](https://github.com/biocodellc/ppo-data-pipeline).  There is a front-end in development
which calls the ppo-data-server, called the [ppo-data-interface](https://github.com/biocodellc/ppo-data-interface).

In technical speak, the ppo-data-service is a node.js reverse proxy to the elasticsearch database service, which is run
on a different server, secured by an opening through a firewall via a dedicated port.

Currently, the ppo-data-server is running under the name https://www.plantphenology.org/api/v1/{query|download|ppo} .
To interact with this service, elasticsearch style GET and POST requests can be sent to this endpoint. 
Note that most requests and all responses to this service require packaging in JSON formatted text.  The ElasticSearch website offers some help on [Query Syntax](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html).

Following are the services:

  *  [es_proxy](docs/es_proxy.md)  /v1/query (query service)
  *  [download_proxy](docs/download_proxy.md) /v1/download (download service)
  *  [ontology_proxy](docs/ontology_proxy.md)  /v1/ppo (term lookup service)

