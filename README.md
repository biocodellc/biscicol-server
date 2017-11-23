# Installing
The ppo-data-service relies on a node.js front-end which in turn uses pm2 to start the es_proxy.js script.
The es_proxy.js runs on port 3100, and reverse proxied by apache to port 80.  The es_proxy.js script limits the 
types of requests sent to elasticsearch so users may only run queries.  

Sample usage for pm2:
```
pm2 startup centos6 -u user --hp /home/user
pm2 start es_proxy.js
pm2 list
pm2 stop es_proxy.js
```
Currently, this service is running under the name http://www.dev.plantphenology.org/

# Get list of indices:
```
curl 'http://www.dev.plantphenology.org/api/_cat/indices?pretty'
```

# Query for genus = Quercus
```
curl 'http://www.dev.plantphenology.org/api/_search?pretty&q=genus:Quercus'
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

Here is a sample input file (file.json)

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

