var elasticsearch=require('elasticsearch');

var client = new elasticsearch.Client( {  
  hosts: [
    'http://128.196.254.92:80/'
  ]
});

module.exports = client;
