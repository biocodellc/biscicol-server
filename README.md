# About ppo-data-server

The PPO data server is a machine level interface to the elasticsearch database back-end storing all indexed results
from the [ppo-data-pipeline](https://github.com/biocodellc/ppo-data-pipeline).  There is a front-end in development
which calls the ppo-data-server, called the [ppo-data-interface](https://github.com/biocodellc/ppo-data-interface).

In technical speak, the ppo-data-service is a node.js reverse proxy to the elasticsearch database service, which is run
on a different server, secured by an opening through a firewall via a dedicated port.

Currently, the ppo-data-server is running under the name http://www.dev.plantphenology.org/api/ .
To interact with this service, elasticsearch style GET and POST requests can be sent to this endpoint. 
Note that most requests and all responses to this service require packaging in JSON formatted text.  The ElasticSearch website offers some help on [Query Syntax])(https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html).

Following are some examples of interacting with the endpoint using [curl](https://curl.haxx.se/).   Note that the requests below mainly offer methods of retrieving results of less than 10,000 records.   See the [section on es2csv](https://github.com/biocodellc/ppo-data-server#fetch-a-large-number-of-records-using-es2csv) to retrieve more than 10,000 records or to return results as CSV.

Following are the services:

  *  [es_proxy](docs/es_proxy.md)
  *  [download](docs/download.md)
  *  [ontologyProxy](docs/ontologyProxy.md)

