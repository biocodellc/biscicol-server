# Installation
The ppo-data-service relies on a node.js front-end which in turn uses pm2 to start the es_proxy.js script.
The es_proxy.js runs on port 3100, and reverse proxied by apache to port 80.  The es_proxy.js script limits the 
types of requests sent to elasticsearch so users may only run queries.  

Sample usage for pm2:
```
pm2 startup centos6 -u user --hp /home/user
pm2 start es_proxy.js
pm2 list
pm2 stop es_proxy.js
```
Currently, this service is running under the name http://www.dev.plantphenology.org/
