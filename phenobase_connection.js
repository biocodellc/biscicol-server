var elasticsearch=require('elasticsearch');

var client = new elasticsearch.Client( {  
  hosts: [
    'http://149.165.170.158:80/'
  ]
});

module.exports = client;
