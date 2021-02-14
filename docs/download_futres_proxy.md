# FuTRES download API instructions

The download_proxy parameters are the same as the [es_proxy](docs/es_futres_proxy.js) service function calls (see docs for details).
The download_proxy bundles thre files in response: 
 * citation file includes information on how to cite date
 * README file which contains information on the query that was ran and number of results
 * data.csv file which contains the data in comma separated value format with the first line being column headers.

```
curl 'https://www.plantphenology.org/futresapi/v2/download/_search?pretty&size=1&q=mapped_traits:depth' > download.tar.gz
gunzip download.tar.gz
tar xvf download.tar
```
