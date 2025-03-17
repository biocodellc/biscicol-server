var elasticsearch=require('elasticsearch');

var client = new elasticsearch.Client( {  
  hosts: [
    'http://149.165.170.158:8081/'
  ]
});

module.exports = client;
