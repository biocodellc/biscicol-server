# Arctos Query API v2

Run Elasticsearch queries against the Arctos v2 data store through a CORS-friendly proxy.

See [Extending Elasticsearch queries](elasticsearch_queries.md) for reusable
query-string and JSON Query DSL examples, field types, sorting, counts, pagination,
aggregations, and links to Elastic's official references.

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

**Extend a query**

Combine a family with alternative states and a year range. `--data-urlencode`
handles spaces, quotes, and brackets:

```bash
curl --get 'https://biscicol.org/arctos/api/v2/query/arctos/_search' \
  --data-urlencode 'q=family:Leporidae AND state_prov:(Texas OR Colorado) AND year:[1950 TO 2020]' \
  --data-urlencode 'size=2' \
  --data-urlencode '_source=guid_prefix,cat_num,scientific_name,state_prov,year' \
  --data-urlencode 'sort=year:desc' \
  --data-urlencode 'track_total_hits=true' \
  --data-urlencode 'pretty=true'
```

`size` limits the returned page; `track_total_hits=true` requests the exact number
of matches. Without it, a total with `relation: "gte"` is only a lower bound.
See the shared guide for [pagination limits](elasticsearch_queries.md#control-the-result-page-and-total)
and [structured POST queries](elasticsearch_queries.md#use-json-query-dsl-for-structured-searches).

`family`, `genus`, `country`, and `state_prov` are keyword fields; use their stored
spelling and case. `scientific_name` is analyzed text and `year` is an integer.
Additional CSV columns can appear in `_source` without being indexed: check the
mapping before adding a new searchable field or assuming a `.keyword` subfield.

**Notes**

* This endpoint is additive; `/arctos/api/v1/query` continues to use the existing v1 backend.
* Query syntax and response shape are Elasticsearch-compatible and should match the v1 Arctos query API when the v2 `arctos` index has the same mapping.
