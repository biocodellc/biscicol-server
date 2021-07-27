# Futres DATA SERVICE query instructions


To interact with this service, elasticsearch style GET and POST requests can be sent to this endpoint. 
Note that most requests and all responses to this service require packaging in JSON formatted text.  The ElasticSearch website offers some help on [Query Syntax](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html).

Following are some examples of interacting with the endpoint using [curl](https://curl.haxx.se/).   Note that the requests below mainly offer methods of retrieving results of less than 10,000 records.   See the [section on es2csv](https://github.com/biocodellc/ppo-data-server#fetch-a-large-number-of-records-using-es2csv) to retrieve more than 10,000 records or to return results as CSV.

# Get list of indices:
This query shows the available indices at this endpoint
Can be executed from the browser simply as: https://biscicol.org/api/v1/query/_cat/indices?pretty
```
curl 'https://biscicol.org/futresapi/v1/query/_cat/indices?pretty'
```

# Query examples
Note that the attribute size can be adjusted up to 10,000 records.

Can be executed from the browser or curl:
```
# query on genus & sex & year example
curl 'https://biscicol.org/futresapi/v1/query/_search?from=0&size=25&_source=decimalLatitude,decimalLongitude,yearCollected,scientificName,sex,measurementType,country,measurementUnit,measurementValue&q=++yearCollected:%3E=1868+AND++yearCollected:%3C=2020++AND++scientificName:Puma+concolor+AND++sex:male&pretty'


# query on yearCollected example
https://biscicol.org/futresapi/v1/query/_search?from=0&size=5&_source=decimalLatitude,decimalLongitude,yearCollected,scientificName&q=++yearCollected:>=1868+AND++yearCollected:<=2019
curl 'https://biscicol.org/futresapi/v1/query/_search?from=0&size=5&_source=decimalLatitude,decimalLongitude,yearCollected,scientificName&q=++yearCollected:>=1868+AND++yearCollected:<=2019'
```

