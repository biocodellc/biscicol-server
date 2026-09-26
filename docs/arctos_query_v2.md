# Arctos Query API v2

Run Elasticsearch queries against the Arctos v2 data store through a CORS-friendly proxy.

**Base URL**

```
https://biscicol.org/arctos/api/v2/query/
```

The path after `/arctos/api/v2/query/` is forwarded to Elasticsearch. Most requests should target the `arctos` index:

```
https://biscicol.org/arctos/api/v2/query/arctos/_search
```

**Backend**

The service reads from the Elasticsearch URL configured by `ARCTOS_ELASTIC_URL`.
If unset, it defaults to:

```
https://huxley.bnhm.berkeley.edu:1113/
```

**Auth & CORS**

* External callers do not need Elasticsearch credentials. The service supplies its configured read-only API key.
* `Access-Control-Allow-Origin: *` is set on responses.

**Allowed verbs**

| Method | Use | Notes |
| ------ | --- | ----- |
| **GET** | URL-encoded Elasticsearch query-string searches | Good for browser-friendly requests and small queries. |
| **POST** | Elasticsearch JSON Query DSL | Recommended for structured filters, aggregations, and longer queries. |

Unsupported methods return HTTP 405 and a JSON error body:

```json
{"error":"<verb> request method is not supported. Use GET or POST."}
```

**Index**

| Name | Description |
| ---- | ----------- |
| `arctos` | Arctos specimen and occurrence records indexed for BISCICOL search. |

**Query examples**

Return two Leporidae records with selected fields:

```
curl 'https://biscicol.org/arctos/api/v2/query/arctos/_search?pretty&size=2&_source=guid_prefix,cat_num,scientific_name,family,country,state_prov,year&q=family:Leporidae'
```

Search by genus:

```
curl 'https://biscicol.org/arctos/api/v2/query/arctos/_search?pretty&size=5&_source=guid_prefix,cat_num,scientific_name,genus,country,state_prov,year&q=genus:Microtus'
```

Inspect the live mapping:

```
curl 'https://biscicol.org/arctos/api/v2/query/arctos/_mapping?pretty'
```

**Notes**

* This endpoint is additive; `/arctos/api/v1/query` continues to use the existing v1 backend.
* Query syntax and response shape are Elasticsearch-compatible and should match the v1 Arctos query API when the v2 `arctos` index has the same mapping.
