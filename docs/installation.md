# Installation
The ppo-data-service relies on a node.js front-end which in turn uses pm2 to start the es_proxy.js script.
The es_proxy.js runs on port 3001, download_proxy.js runs on 3002, and ontology_proxyjs on 3000 and reverse proxied by apache to port 80.    

Sample usage for pm2:
```
pm2 startup centos6 -u user --hp /home/user
pm2 start es_proxy.js
pm2 list
pm2 stop es_proxy.js
```
Currently, this service is running under the name https://biscicol.org/api/v1/...
