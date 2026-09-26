# Arctos Download API v1

Download Arctos query results as a zip archive containing CSV data and metadata.

Extend `q` with Boolean operators, phrases, ranges, or field-existence checks;
see [Extending Elasticsearch queries](elasticsearch_queries.md#extend-the-q-filter)
for examples and official references. This download wrapper reads `q` and `limit`,
not arbitrary search options such as JSON Query DSL, `_source`, `size`, or `aggs`.
Use this page's v1 URL and limits when adapting examples from the shared guide.

**Base URL**

```
https://biscicol.org/arctos/api/v1/download/
```

**Documented request format**

The download endpoint reads query parameters from the URL. The conventional path is `/_search`:

```
https://biscicol.org/arctos/api/v1/download/_search?q=<lucene-query>&limit=<record-limit>
```

**Query parameters**

| Parameter | Required | Default | Description |
| --------- | -------- | ------- | ----------- |
| `q` | No | `*` | Elasticsearch query-string query used against the `arctos` index. |
| `limit` | No | `100000` | Maximum number of records to write to `data.csv`. Use a positive integer. |

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
curl 'https://biscicol.org/arctos/api/v1/download/_search?q=family:Leporidae&limit=2' > arctos_download.zip
unzip arctos_download.zip
```

Download Microtus records:

```
curl 'https://biscicol.org/arctos/api/v1/download/_search?q=genus:Microtus&limit=1000' > arctos_microtus.zip
unzip arctos_microtus.zip
```

Download records from California in the United States:

```
curl 'https://biscicol.org/arctos/api/v1/download/_search?q=country:%22United%20States%22%20AND%20state_prov:California&limit=10000' > arctos_california.zip
unzip arctos_california.zip
```

Download records from a year range:

```
curl 'https://biscicol.org/arctos/api/v1/download/_search?q=year:%5B1950%20TO%202000%5D&limit=10000' > arctos_1950_2000.zip
unzip arctos_1950_2000.zip
```

Download all indexed Arctos records up to the default limit:

```
curl 'https://biscicol.org/arctos/api/v1/download/_search' > arctos_download.zip
unzip arctos_download.zip
```

**No-result responses**

If the query returns no records, the service responds with HTTP `204`. The
handler sets this error body, though clients may receive an empty body because
`204` responses do not normally include content:

```json
{"error":"no results found"}
```

**Notes**

* The download service searches the `arctos` index.
* The CSV includes all fields stored in each matching Elasticsearch document.
* The service fetches records in scroll batches of up to 10,000 until the requested limit is reached.
