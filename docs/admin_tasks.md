# Administration tasks 
A file containing various admin task protocols

# Update pm2 startup list 

Visit instructions at http://pm2.keymetrics.io/docs/usage/startup/

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

# Installing node on ubuntu 18.04
this comes with an old version of nodejs and which also is incompatible with npm
I followed instructions here:
https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04
https://forum.pine64.org/showthread.php?tid=10965

# Creating a start script
Need to create a start script for pm2 and re-create if major version changes happen with nodejs
After running the `start.sh` script, the run the following:
```
pm2 startup
```

