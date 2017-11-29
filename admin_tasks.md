# Administration tasks 
A file containing various admin task protocols

# Logging queries
Queries can be logged using the "slowlog".  You turn the slowlog on for each index
and appears to be required to be done using PUT statements for each index and setting
the query time to 0.  

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
