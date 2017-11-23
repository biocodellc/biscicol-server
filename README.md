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
http://www.dev.plantphenology.org/api/_cat/indices?pretty
```

# Simple Query genus equals quercus
```
curl 'http://www.dev.plantphenology.org/api/_search?pretty&q=genus:Quercus'
```

# Query genus and year by sending JSON
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

# Query genus and Senescing true leaves present (PPO_0002317) 
# return a specified set of fields and from 0 to 1000
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

# Example of fetching a large number of records using es2csv 

es2csv (https://github.com/taraslayshchuk/es2csv) is a useful tool writtin in python for fetching
records from ES.  es2csv implements ES scrolling (https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-scroll.html#scroll-scan)
for working with large results sets.
```
es2csv -u http://www.dev.plantphenology.org:80/api -i _all -r -q @'file2.json'  -o database.csv
```

In the above example, file.json can be something like the following, fetching all Quercus with senescing true leaves present:

```
{
  "_source": ["latitude", "longitude", "dayOfYear", "year", "source"],
  "query": {
    "bool": {
      "must": [
        { "match": { "genus":  "Quercus" }},
        { "match": { "plantStructurePresenceTypes":  "obo:PPO_0002317" }}
      ]
    }
  }
}
```


