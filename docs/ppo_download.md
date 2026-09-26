# Download API instructions

The `q` parameter supports Elasticsearch query-string filters such as
`genus:Acacia AND source:"USA-NPN" AND year:[2010 TO 2020]`. See the
[shared query guide](elasticsearch_queries.md#reuse-a-filter-for-downloads) for
URL encoding, additional operators, and official references. Use PPO field names
and this service's documented parameters; the download route is not a general
JSON Query DSL search endpoint.

The download_proxy bundles thre files in response: 
 * citation file includes information on how to cite date
 * README file which contains information on the query that was ran and number of results
 * data.csv file which contains the data in comma separated value format with the first line being column headers.

```
curl 'https://biscicol.org/ppo/api/v3/download/_search?pretty&limit=100000&q=genus:Acacia+AND+source:USA-NPN' > download.zip
unzip download.zip
```
