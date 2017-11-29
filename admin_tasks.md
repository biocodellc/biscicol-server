A file containing various admin task protocols
# updating slowlog
curl -XPUT 'localhost:80/npn/_settings?pretty' -H 'Content-Type: application/json' -d'
{
	"index.search.slowlog.threshold.query.info" : "0" 
}
'
curl -XPUT 'localhost:80/pep725/_settings?pretty' -H 'Content-Type: application/json' -d'
{
	"index.search.slowlog.threshold.query.info" : "0" 
}
'
