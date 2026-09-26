# Amphbian Disease Portal Download

Add a `q` parameter to filter the export with Elasticsearch query-string syntax.
See the [shared query guide](elasticsearch_queries.md#reuse-a-filter-for-downloads)
for Boolean operators, ranges, URL encoding, and official references. Use fields
mapped in the Amphibian Disease dataset; the guide's Arctos fields may not apply.
The download route does not accept arbitrary JSON Query DSL or aggregations.

The download_proxy bundles thre files in response: 
 * citation file includes information on how to cite date
 * README file which contains information on the query that was ran and number of results
 * data.csv file which contains the data in comma separated value format with the first line being column headers.

```
curl 'https://biscicol.org/amphibian_disease/api/v3/download/_search?&limit=100000' > download.zip
unzip download.zip
```
