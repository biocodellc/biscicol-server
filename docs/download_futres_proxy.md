# FuTRES download API instructions

The download_proxy parameters are the same as the [es_futres_proxy](es_futres_proxy.md)  service function calls (see docs for details).
The download_proxy bundles thre files in response: 
 * citation file includes information on how to cite date
 * README file which contains information on the query that was ran and number of results
 * data.csv file which contains the data in comma separated value format with the first line being column headers.

```
curl 'https://biscicol.org/futresapi/v3/download/_search?q=+mapped_traits:%22body+height%22&limit=100000' > download.zip
unzip download.zip
```
