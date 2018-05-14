#!/bin/sh
pm2 restart download_proxy --max-memory-restart 300M 
pm2 restart download_proxy_v2 --max-memory-restart 1000M --node-args="--max_old_space_size=1000M" 
pm2 restart es_proxy --max-memory-restart 300M --node-args="--max_old_space_size=300M" 
pm2 restart kibana_proxy --max-memory-restart 300M
pm2 restart ontology_proxy --max-memory-restart 1000M --node-args="--max_old_space_size=1000M" 
pm2 restart ontology_proxy_v2  --max-memory-restart 300M --node-args="--max_old_space_size=1000M" 
