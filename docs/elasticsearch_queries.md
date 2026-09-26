# Extending Elasticsearch queries

The query APIs forward searches to Elasticsearch, so the examples in each service's
documentation are starting points. You can combine filters and request counts,
selected fields, sorting, and aggregations.

These patterns apply to [Arctos v1](arctos_query.md), [Arctos v2](arctos_query_v2.md),
[Phenobase](phenobase_query.md), and [PPO](ppo_query.md). Use each service's documented
URL, index, and field names. Backend Elasticsearch versions and mappings differ;
the API's `v1` or `v2` is not the Elasticsearch version. The examples below use
Arctos v2 and its `arctos` alias on Lupinus.

## Extend the `q` filter

The `q` parameter accepts Elasticsearch's Lucene-style query-string syntax.
These are values to put inside `q`, before URL encoding:

| Goal | Query |
| --- | --- |
| One family | `family:Leporidae` |
| Both conditions | `family:Leporidae AND country:"United States"` |
| Either family | `family:(Leporidae OR Cricetidae)` |
| Exclude a state | `family:Leporidae AND NOT state_prov:Texas` |
| Group alternatives | `family:Leporidae AND (state_prov:Texas OR state_prov:Colorado)` |
| Inclusive year range | `year:[1950 TO 2020]` |
| Open-ended range | `year:[2000 TO *]` |
| Scientific-name phrase | `scientific_name:"Sylvilagus floridanus"` |
| Genus prefix | `genus:Sylvil*` |
| Both coordinates indexed | `_exists_:dec_lat AND _exists_:dec_long` |
| Missing indexed year | `NOT _exists_:year` |

Use uppercase `AND`, `OR`, and `NOT`, and parentheses to make grouping explicit.
Quotes mean a phrase on analyzed text; they do not turn it into a keyword field.
Prefer a specific prefix such as `Sylvil*` over a leading wildcard such as `*vil*`.
For more operators, see Elastic's [query-string syntax reference](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-query-string-query).

Let `curl` encode spaces, quotes, brackets, and ampersands using `--get` and
`--data-urlencode`:

```bash
curl --get 'https://biscicol.org/arctos/api/v2/query/arctos/_search' \
  --data-urlencode 'q=family:Leporidae AND country:"United States" AND (state_prov:Texas OR state_prov:Colorado) AND year:[1950 TO 2020]' \
  --data-urlencode 'size=5' \
  --data-urlencode '_source=guid_prefix,cat_num,scientific_name,family,country,state_prov,year' \
  --data-urlencode 'track_total_hits=true' \
  --data-urlencode 'pretty=true'
```

URL encoding and query escaping are separate. An unquoted literal colon in a value
needs escaping, for example `guid_prefix:ASNHC\:Mamm`; the quoted form
`guid_prefix:"ASNHC:Mamm"` also works. JSON strings need doubled backslashes.
For literal values containing operators, a JSON `term` query on a keyword field
avoids the query-string parser.

## Check which fields are searchable

Inspect the index's [mapping](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-get-mapping):

```bash
curl 'https://biscicol.org/arctos/api/v2/query/arctos/_mapping?pretty'
```

Examples from the Arctos v2 mapping:

| Fields | Type | Suitable uses |
| --- | --- | --- |
| `family`, `genus`, `country`, `state_prov`, `guid_prefix` | `keyword` | Exact filters, sorting, grouping |
| `scientific_name` | `text` | Analyzed word or phrase searches |
| `year` | `integer` | Numeric ranges and sorting |
| `dec_lat`, `dec_long` | `float` | Numeric ranges |

Use [`term`](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-term-query)
for exact keyword values, retaining their stored spelling and case. Use
[`match`](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-match-query)
for analyzed text, or `match_phrase` when word order matters. A `match` query uses
OR between words by default; set `operator: "and"` to require all words.

Do not automatically append `.keyword`: it only works when that subfield exists
in the mapping. Arctos's `family` is already a keyword field.

Arctos v2 retains additional CSV columns in `_source` with dynamic mapping disabled.
A field appearing in returned JSON does not guarantee that it is indexed or
searchable. `_exists_` checks indexed values, not merely keys present in `_source`.

## Control the result page and total

| Parameter | Example | Effect |
| --- | --- | --- |
| `size` | `size=25` | Return up to 25 records on this page |
| `from` | `from=25` | Skip the first 25 matches |
| `_source` | `_source=guid_prefix,cat_num,year` | Return only these source fields; does not filter matching records |
| `sort` | `sort=year:desc` | Order by a mapped numeric or keyword field |
| `track_total_hits` | `track_total_hits=true` | Request an exact matching count |
| `pretty` | `pretty=true` | Indent the JSON response |

`hits.total.relation: "gte"` means the reported total is a lower bound, commonly
10,000; `"eq"` means it is exact. `size=2` limits the returned page, not the number
of matches. Exact counting can take longer for broad searches. These options are
described in the [search API guide](https://www.elastic.co/docs/solutions/search/the-search-api).

If only a count is needed:

```bash
curl --get 'https://biscicol.org/arctos/api/v2/query/arctos/_count' \
  --data-urlencode 'q=family:Leporidae AND year:[2000 TO *]' \
  --data-urlencode 'pretty=true'
```

For ordinary paging, increase `from` by `size` and keep the same query and sort.
The default `from + size` window is 10,000. `track_total_hits=true` does not enlarge
that window. Use the download API for CSV exports; for deeper application paging,
see [`search_after` and point-in-time pagination](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/paginate-search-results).
Those features require support and permissions on the selected backend and proxy;
they are not guaranteed on every BISCICOL endpoint.

## Use JSON Query DSL for structured searches

POST a JSON body for longer searches or programmatically assembled filters. Avoid
also supplying `q` in the URL: Elasticsearch gives it precedence over the body's
`query`. See the [Query DSL reference](https://www.elastic.co/docs/reference/query-languages/querydsl).

```bash
curl -X POST 'https://biscicol.org/arctos/api/v2/query/arctos/_search?pretty' \
  -H 'Content-Type: application/json' \
  -d '{
    "size": 5,
    "track_total_hits": true,
    "_source": ["guid_prefix", "cat_num", "scientific_name", "family", "state_prov", "year"],
    "sort": [{ "year": "desc" }],
    "query": {
      "bool": {
        "must": [
          { "match": { "scientific_name": { "query": "Sylvilagus floridanus", "operator": "and" } } }
        ],
        "filter": [
          { "term": { "family": "Leporidae" } },
          { "terms": { "state_prov": ["Texas", "Colorado"] } },
          { "range": { "year": { "gte": 1950, "lte": 2020 } } }
        ]
      }
    }
  }'
```

Extend `bool.filter` with more required filters; use `must_not` for exclusions.
`terms` accepts any listed value. For alternatives using `bool.should`, set
`minimum_should_match: 1` when at least one alternative must match; otherwise
`should` clauses become optional when `must` or `filter` is also present. See the
[`bool` query reference](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-bool-query).

## Group matching records with aggregations

Set `size` to zero when you want summary buckets without individual records.
This query groups matching Leporidae records by state:

```bash
curl -X POST 'https://biscicol.org/arctos/api/v2/query/arctos/_search?pretty' \
  -H 'Content-Type: application/json' \
  -d '{
    "size": 0,
    "track_total_hits": true,
    "query": { "term": { "family": "Leporidae" } },
    "aggs": {
      "by_state": { "terms": { "field": "state_prov", "size": 10 } }
    }
  }'
```

The outer `size` controls records; `aggs.by_state.terms.size` controls buckets.
`terms` returns the top buckets, not every distinct value, and counts can be
approximate across shards. Do not sum facet counts to get the total number of
matching records. See [terms aggregations](https://www.elastic.co/docs/reference/aggregations/search-aggregations-bucket-terms-aggregation)
for bucket limits, ordering, and count accuracy.

## Reuse a filter for downloads

The documented download services accept query-string filters through `q`.
For Arctos v2:

```bash
curl --get 'https://biscicol.org/arctos/api/v2/download/_search' \
  --data-urlencode 'q=family:Leporidae AND country:"United States" AND (state_prov:Texas OR state_prov:Colorado) AND year:[1950 TO 2020]' \
  --data-urlencode 'limit=1000' \
  --output arctos_filtered.zip
```

Download routes are export wrappers. They do not accept arbitrary JSON Query DSL,
aggregations, `_source`, `from`, or `size` just because the query API does. Use `q`
to select records and the service's documented `limit` to control the export.
Arctos v2 supports `limit=0` for all matches; other versions have different defaults
and limits. See [Arctos v1](arctos_download.md), [Arctos v2](arctos_download_v2.md),
[PPO](ppo_download.md), and [Amphibian Disease](amphibian_disease_download.md).

## More query options

Start with Elastic's [Query DSL catalog](https://www.elastic.co/docs/reference/query-languages/querydsl)
for other query types, including phrase, fuzzy, nested, and geographic searches.
Some need special mappings: latitude and longitude stored as separate floats do
not by themselves provide a `geo_point` field for `geo_distance` queries.
Consult the documentation for your backend's Elasticsearch version when adapting
examples from the current reference.
