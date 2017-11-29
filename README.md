# About ppo-data-server
The PPO data server is a machine level interface to the elasticsearch database back-end storing all indexed results
from the [https://github.com/biocodellc/ppo-data-pipeline](ppo-data-pipeline).  There is a front-end in development
which calls the ppo-data-server, called the [https://github.com/biocodellc/ppo-data-interface](ppo-data-interface)

In technical speak, the ppo-data-service is a node.js reverse proxy to the elasticsearch database service, which is run
on a different server, secured by an opening through a firewall via a dedicated port.

Currently, the ppo-data-server is running under the name http://www.dev.plantphenology.org/api/ .
To interact with this service, elasticsearch style GET and POST requests can be sent to this endpoint. 
Note that most requests and all responses to this service require packaging in JSON formatted text.
Following are some examples of interacting with the endpoint using [https://curl.haxx.se/](curl).  

Finally, note that the requests below mainly offer methods of retrieving results of less than 10,000 records.  
See the section on es2csv to retrieve more than 10,000 records or implement elasticsearch style 
[https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-scroll.html](scrolling)

# Get list of indices:
This query shows the available indices at this endpoint
Can be executed from the browser simply as: http://www.dev.plantphenology.org/api/_cat/indices?pretty
```
curl 'http://www.dev.plantphenology.org/api/_cat/indices?pretty'
```

# Query for genus = Quercus
A very simple query to return results for a particular genus, limiting to just one record.
The attribute size can be adjusted up to 10,000 records.

Can be executed from the browser simply as: http://www.dev.plantphenology.org/api/_search?pretty&size=1&q=genus:Quercus
```
curl 'http://www.dev.plantphenology.org/api/_search?pretty&size=1&q=genus:Quercus'
```

# Query by sending JSON request
```
curl -XGET 'http://www.dev.plantphenology.org/api/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        { "match": { "genus":  "Quercus" }},
        { "match": { "year": "2012"   }}
      ]
    }
  }
}
'
```

# Specifying particular fields using _source
```
curl -XGET 'http://www.dev.plantphenology.org/api/_search?pretty&scroll=1m' -H 'Content-Type: application/json' -d'
{
  "from" : 0, "size" : 10,
  "_source": ["latitude", "longitude", "dayOfYear", "year", "source"],
  "query": {
    "bool": {
      "must": [
        { "match": { "genus":  "Quercus" }},
        { "match": { "source":  "PEP725" }},
        { "match": { "plantStructurePresenceTypes":  "obo:PPO_0002317" }}
      ]
    }
  }
}
'
```

# Fetch a large number of records using es2csv

es2csv (https://github.com/taraslayshchuk/es2csv) is a useful tool writtin in python for fetching
records from ES.  es2csv implements ES scrolling (https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-scroll.html#scroll-scan)
for working with large results sets.  The following tells the script to use a scrolling size of 10,000 records, 
write output to database.csv and read the query from file.json using raw format, and using all available indices:
```
es2csv -u http://www.dev.plantphenology.org:80/api -i _all -r -q @'file.json'  -s 10000 -o database.csv
```

Here is a sample input file  for maples with  true leaves present:

```
{
  "_source": ["latitude", "longitude", "dayOfYear", "year", "source"],
  "query": {
    "bool": {
      "must": [
        { "match": { "genus":  "Acer" }},
        { "match": { "plantStructurePresenceTypes":  "obo:PPO_0002313" }}
      ]
    }
  }
}
```
Or, another example for lilacs with floral structures present:
```
{
  "_source": ["latitude", "longitude", "dayOfYear", "year", "source"],
  "query": {
    "bool": {
      "must": [
        { "match": { "genus":  "Syringa" }},
        { "match": { "plantStructurePresenceTypes":  "obo:PPO_0002324" }}
      ]
    }
  }
}
```
Output looks like:

```
latitude,source,dayOfYear,longitude,year
47.65,NPN,138,-110.67,1956
45.92,NPN,140,-108.25,1956
45.48,NPN,152,-108.97,1956
45.92,NPN,154,-104.08,1956
45.63,NPN,143,-106.65,1956
48.4,NPN,155,-115.53,1956
44.65,NPN,154,-112.58,1956
44.65,NPN,160,-112.58,1956
45.3,NPN,157,-107.37,1956
```

# Group by with counts (using curl)
```
curl -XGET 'http://www.dev.plantphenology.org/api/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "size": 0,
    "aggs": {
       "group_by_genus": {
           "terms": {
               "field": "genus.keyword",
               "size": 1000
       }
    }
  }
}
'
```

# Group by scientific name with counts (using curl)
```
curl -XGET 'http://www.dev.plantphenology.org/api/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "size": 0,
    "aggs": {
       "group_by_genus": {
           "terms": {
	       "field": "scientificName.keyword",
	       "size": 10000
       }
    }
  }
}
'
```
