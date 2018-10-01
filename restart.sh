#!/bin/sh
pm2 restart download_proxy_v2 --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 restart es_proxy --max-memory-restart 300M --node-args="--max_old_space_size=300"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 restart kibana_proxy --max-memory-restart 300M --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 restart ontology_proxy --max-memory-restart 1000M --node-args="--max_old_space_size=1000"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 restart ontology_proxy_v2  --max-memory-restart 300M --node-args="--max_old_space_size=1000"  --log-date-format="YYYY-MM-DD HH:mm Z"
