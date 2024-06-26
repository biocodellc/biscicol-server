# Amphbian Disease Portal Download

The download_proxy bundles thre files in response: 
 * citation file includes information on how to cite date
 * README file which contains information on the query that was ran and number of results
 * data.csv file which contains the data in comma separated value format with the first line being column headers.

```
curl 'https://biscicol.org/amphibian_disease/api/v3/download/_search?&limit=100000' > download.zip
unzip download.zip
```
