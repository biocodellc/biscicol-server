#!/bin/sh
pm2 start download_proxy_v2.js --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 start es_proxy.js --max-memory-restart 300M --node-args="--max_old_space_size=300"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 start ontology_proxy.js --max-memory-restart 1000M --node-args="--max_old_space_size=1000"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 start ontology_proxy_v2.js  --max-memory-restart 300M --node-args="--max_old_space_size=1000"  --log-date-format="YYYY-MM-DD HH:mm Z"
