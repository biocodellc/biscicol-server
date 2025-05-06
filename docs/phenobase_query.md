# Phenobase Query API v1 – Quick Reference 

Run (almost) raw Elasticsearch queries through a CORS‑friendly proxy.

**Base URL**

```
https://biscicol.org/phenobase/api/v1/query/
```

Example query to search for a specific machine_learning_annotation_id:
```
curl -L -X POST "https://biscicol.org/phenobase/api/v1/query//phenobase/_search" \
  -H "Origin: https://phenobase.netlify.app" \
  -H "Referer: https://phenobase.netlify.app/" \
  -H "User-Agent: Mozilla/5.0" \
  -H "Accept: application/json, text/javascript, */*; q=0.01" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "query_string": {
        "default_field": "machine_learning_annotation_id",
        "query": "\"a3551e3a-47b8-4cf4-b972-d45c6091df17\"",
        "analyze_wildcard": true
      }
    },
    "size": 5
  }'
```

**Auth & CORS**

* External callers: no auth needed (proxy injects Basic‑Auth to ES).
* `Access‑Control‑Allow-Origin: *` set on every response.

**Allowed verbs**

| Method | Use | Notes |
| ------ | --- | ----- |
| **GET**  | URL‑encoded queries | Path + query string must equal your ES endpoint. |
| **POST** | JSON Query DSL / bulk | `Content-Type: application/json`. |

_Any other verb →_ `{"error":"<verb> request method is not supported. Use GET or POST."}`

**Common query patterns**

| Goal | GET / Query String | POST body snippet |
| ---- | ------------------ | ----------------- |
| Free‑text | `q=flower` | `{ "match": { "_all": "flower" }}` |
| Exact field | `q=species.keyword:Arabidopsis_thaliana` | `{ "term": { "species.keyword": "Arabidopsis_thaliana" }}` |
| Prefix | `q=species.keyword:Arabidopsis*` | `{ "prefix": { "species.keyword": "Arabidopsis" }}` |
| Range | — | `{ "range": { "value": { "gte": 10, "lte": 50 }}}` |
| Pagination | `size=50&from=0` | `"size":50, "from":0` |
| Sorting | `sort=value:asc` | `"sort":[{"value":"asc"}]` |
| Aggregations | — | `"aggs":{ … }` |

**Endpoint examples**

```
GET  /phenobase/api/v1/query/traits/_search?q=flower
GET  /phenobase/api/v1/query/traits/_search?q=trait_name:leaf_length&size=20&from=0
POST /phenobase/api/v1/query/traits/_search  ← full DSL / aggs / bulk, etc.
GET  /phenobase/api/v1/query/traits/_doc/<document‑id>            ← ID lookup
```

**Response anatomy**

```json
{
  "hits": {
    "total": { "value": 1234 },
    "hits": [ { "_id":"…", "_source":{…}, "_score":1.2 }, … ]
  },
  "aggregations": { … }   // present only if requested
}
```

**Errors**

| Code | Cause |
| ---- | ----- |
| 400  | Malformed ES query (ES error body returned) |
| 405  | Unsupported verb |
| 502  | ES host unreachable / proxy error |

**Tips & gotchas**

* Long queries? Use **POST** (browsers may truncate huge GET URLs).
* Proxy disables gzip for easier debugging (`accept‑encoding: none`).
* Requests to `/favicon.ico` are ignored.
* After `/phenobase/api/v1/query/`, the path is forwarded *verbatim* – double‑check your ES path.
