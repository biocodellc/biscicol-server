# Arctos Query API v1

Run Elasticsearch queries against the Arctos data store through a CORS-friendly proxy.

For Boolean filters, ranges, phrases, JSON Query DSL, and official syntax references,
see [Extending Elasticsearch queries](elasticsearch_queries.md). Its examples use
Arctos v2; use this page's v1 URL when querying the original backend.

**Base URL**

```
https://biscicol.org/arctos/api/v1/query/
```

The path after `/arctos/api/v1/query/` is forwarded to Elasticsearch. Most requests should target the `arctos` index:

```
https://biscicol.org/arctos/api/v1/query/arctos/_search
```

**Auth & CORS**

* External callers do not need Elasticsearch credentials.
* `Access-Control-Allow-Origin: *` is set on responses.

**Allowed verbs**

| Method | Use | Notes |
| ------ | --- | ----- |
| **GET** | URL-encoded Elasticsearch query-string searches | Good for browser-friendly requests and small queries. |
| **POST** | Elasticsearch JSON Query DSL | Recommended for structured filters, aggregations, and longer queries. |

Unsupported methods return a JSON error body:

```json
{"error":"<verb> request method is not supported. Use GET or POST."}
```

**Index**

| Name | Description |
| ---- | ----------- |
| `arctos` | Arctos specimen and occurrence records indexed for BISCICOL search. |

**Mapped fields**

The current `arctos` mapping exposes these fields:

| Field | Type |
| ----- | ---- |
| `cat_num` | text |
| `cataloged_item_type` | keyword |
| `collection_cde` | keyword |
| `collectors` | keyword |
| `continent_ocean` | keyword |
| `coordinateuncertaintyinmeters` | float |
| `country` | keyword |
| `county` | keyword |
| `datum` | text |
| `day` | integer |
| `dec_lat` | float |
| `dec_long` | float |
| `family` | keyword |
| `genus` | keyword |
| `guid_prefix` | keyword |
| `has_tissue` | keyword |
| `identifiedby` | text |
| `institution_acronym` | keyword |
| `kingdom` | keyword |
| `month` | integer |
| `parts` | keyword |
| `phylum` | keyword |
| `relatedinformation` | text |
| `scientific_name` | text |
| `species` | keyword |
| `state_prov` | keyword |
| `subspecies` | keyword |
| `taxon_rank` | keyword |
| `type` | keyword |
| `year` | integer |

You can also inspect the live mapping:

```
curl 'https://biscicol.org/arctos/api/v1/query/arctos/_mapping?pretty'
```

**Common query parameters**

| Parameter | Use | Example |
| --------- | --- | ------- |
| `q` | Elasticsearch query-string query | `q=family:Leporidae` |
| `size` | Number of records to return | `size=25` |
| `from` | Offset for pagination | `from=50` |
| `_source` | Comma-separated fields to return | `_source=guid_prefix,cat_num,scientific_name` |
| `sort` | Order by a mapped keyword or numeric field | `sort=year:desc` |
| `track_total_hits` | Request the exact number of matches | `track_total_hits=true` |
| `pretty` | Format JSON response for reading | `pretty` |

**Query examples**

Return two Leporidae records with selected fields:

```
curl 'https://biscicol.org/arctos/api/v1/query/arctos/_search?pretty&size=2&_source=guid_prefix,cat_num,scientific_name,family,country,state_prov,year&q=family:Leporidae'
```

Search by genus:

```
curl 'https://biscicol.org/arctos/api/v1/query/arctos/_search?pretty&size=5&_source=guid_prefix,cat_num,scientific_name,genus,country,state_prov,year&q=genus:Microtus'
```

Filter by collection and year range:

```
curl 'https://biscicol.org/arctos/api/v1/query/arctos/_search?pretty&size=10&_source=guid_prefix,cat_num,scientific_name,collection_cde,year&q=collection_cde:Mammalogy%20AND%20year:%5B1950%20TO%202000%5D'
```

Query by geographic fields:

```
curl 'https://biscicol.org/arctos/api/v1/query/arctos/_search?pretty&size=10&_source=guid_prefix,cat_num,scientific_name,country,state_prov,county&q=country:%22United%20States%22%20AND%20state_prov:California'
```

Send a JSON Query DSL request:

```
curl -X POST 'https://biscicol.org/arctos/api/v1/query/arctos/_search?pretty' \
  -H 'Content-Type: application/json' \
  -d '{
    "size": 5,
    "_source": [
      "guid_prefix",
      "cat_num",
      "scientific_name",
      "family",
      "country",
      "state_prov",
      "year"
    ],
    "query": {
      "bool": {
        "must": [
          { "term": { "family": "Cricetidae" } },
          { "range": { "year": { "gte": 1990, "lte": 2020 } } }
        ]
      }
    }
  }'
```

Group records by family:

```
curl -X POST 'https://biscicol.org/arctos/api/v1/query/arctos/_search?pretty&size=0' \
  -H 'Content-Type: application/json' \
  -d '{
    "aggs": {
      "by_family": {
        "terms": {
          "field": "family",
          "size": 10
        }
      }
    }
  }'
```

Count records matching a query:

```
curl 'https://biscicol.org/arctos/api/v1/query/arctos/_count?pretty&q=genus:Microtus'
```

**Response anatomy**

Search responses are Elasticsearch JSON:

```json
{
  "hits": {
    "total": { "value": 10000, "relation": "gte" },
    "hits": [
      {
        "_index": "arctos",
        "_id": "...",
        "_source": {
          "guid_prefix": "MSB:Mamm",
          "cat_num": "15128",
          "scientific_name": "Microtus longicaudus"
        }
      }
    ]
  },
  "aggregations": {}
}
```

**Tips**

* `hits.total.relation: "gte"` is a lower bound; request `track_total_hits=true` for an exact count. This does not increase the pagination window.
* Use POST for long or structured queries.
* Use `_source` to reduce response size.
* Use the download endpoint for CSV exports.
* Requests to `/favicon.ico` are ignored by the proxy.
