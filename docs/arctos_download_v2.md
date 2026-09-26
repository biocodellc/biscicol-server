# Arctos Download API v2

Download Arctos v2 query results as a zip archive containing CSV data and metadata.

**Base URL**

```
https://biscicol.org/arctos/api/v2/download/
```

**Backend**

The service reads from the Elasticsearch URL configured by `ARCTOS_ELASTIC_URL`.
If unset, it defaults to:

```
https://huxley.bnhm.berkeley.edu:1113/
```

**Documented request format**

The download endpoint reads query parameters from the URL. The conventional path is `/_search`:

```
https://biscicol.org/arctos/api/v2/download/_search?q=<lucene-query>&limit=<record-limit>
```

**Query parameters**

| Parameter | Required | Default | Description |
| --------- | -------- | ------- | ----------- |
| `q` | No | `*` | Elasticsearch query-string query used against the `arctos` index. |
| `limit` | No | `100000` | Maximum number of records to write to `data.csv`. Use `0` to stream all results. |

**Returned archive**

The response is sent as `arctos_download.zip`.

| File | Description |
| ---- | ----------- |
| `data.csv` | Query results as comma-separated values. The first row contains column headers. |
| `ARCTOS_README.txt` | Download metadata, including query, date, requested limit, total possible results, and returned records. |
| `citation_and_data_use_policies.txt` | Data usage and citation guidance for Arctos data. |

**Download examples**

Download two Leporidae records:

```
curl 'https://biscicol.org/arctos/api/v2/download/_search?q=family:Leporidae&limit=2' > arctos_download.zip
unzip arctos_download.zip
```

Download Microtus records:

```
curl 'https://biscicol.org/arctos/api/v2/download/_search?q=genus:Microtus&limit=1000' > arctos_microtus.zip
unzip arctos_microtus.zip
```

Download all indexed Arctos records:

```
curl 'https://biscicol.org/arctos/api/v2/download/_search?limit=0' > arctos_download.zip
unzip arctos_download.zip
```

**No-result responses**

If the query returns no records, the service responds with HTTP `204` and an empty body.

**Notes**

* This endpoint is additive; `/arctos/api/v1/download` continues to use the existing v1 backend.
* The download service searches `ARCTOS_ELASTIC_INDEX`, defaulting to the `arctos` alias.
* The CSV includes all fields stored in each matching Elasticsearch document.
* The service fetches records in scroll batches of up to 1,000 until the requested limit is reached.

* Exact hit totals are requested from Elasticsearch; downloads can exceed 10,000 records.
* Invalid limits return HTTP 400. A limit spanning multiple batches is enforced exactly.
* If the proxy blocks scroll cleanup, the scroll context expires after 60 seconds.
