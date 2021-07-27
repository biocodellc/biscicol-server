# query instructions

To interact with this service, elasticsearch style GET and POST requests can be sent to this endpoint. 
Note that most requests and all responses to this service require packaging in JSON formatted text.  The ElasticSearch website offers some help on [Query Syntax](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html).

Following are some examples of interacting with the endpoint using [curl](https://curl.haxx.se/).   Note that the requests below mainly offer methods of retrieving results of less than 10,000 records.   See the [section on es2csv](https://github.com/biocodellc/ppo-data-server#fetch-a-large-number-of-records-using-es2csv) to retrieve more than 10,000 records or to return results as CSV.

# Get list of indices:
This query shows the available indices at this endpoint
Can be executed from the browser simply as: https://biscicol.org/api/v1/query/_cat/indices?pretty
```
curl 'http://biscicol.org/v1/query/_cat/indices?pretty'
```

# Query for genus = Quercus
A very simple query to return results for a particular genus, limiting to just one record.
The attribute size can be adjusted up to 10,000 records.

Can be executed from the browser simply as: https://biscicol.org/api/v1/query/_search?pretty&size=1&q=genus:Quercus
```
curl 'http://biscicol.org/v1/query/_search?pretty&size=1&q=genus:Quercus'
```

# Query by sending JSON request
```
curl -XGET 'https://biscicol.org/api/v1/query/_search?pretty' -H 'Content-Type: application/json' -d'
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
curl -XGET 'https://biscicol.org/api/v1/query/_search?pretty&scroll=1m' -H 'Content-Type: application/json' -d'
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

For cases where you wish to fetch a larger number of records or you want to retrieve responses as CSV, download and run the [es2csv tool](https://github.com/taraslayshchuk/es2csv).  Es2csv is a command line tool and runs in python so you will need to have some knowledge of running command line commands to use it.  The following example tells the script to use a scrolling size of 10,000 records, 
write output to database.csv and read the query from file.json using raw format, and use all available indices:
```
es2csv -u https://biscicol.org/api/v1/query/ -i _all -r -q @'file.json'  -s 10000 -o database.csv
```

Here is a sample input file, which is referenced in the above command as 'file.json' to query for maples with  true leaves present:

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

If we looked at the database.csv file, the contents would look something like the following:

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
curl -XGET 'https://biscicol.org/api/v1/query/_search?pretty' -H 'Content-Type: application/json' -d'
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
curl -XGET 'https://biscicol.org/api/v1/query/_search?pretty' -H 'Content-Type: application/json' -d'
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
