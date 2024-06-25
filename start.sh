#!/bin/sh
pm2 start ppo.api.v1.query.js --max-memory-restart 300M --node-args="--max_old_space_size=300"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 start ppo.api.v1.ppo.js  --max-memory-restart 300M --node-args="--max_old_space_size=1000"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 start ppo.api.v2.ppo.js --max-memory-restart 1000M --node-args="--max_old_space_size=1000"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 start ppo.api.v2.download.js --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 start ppo.api.v3.download.js --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 start futresapi.v1.query.js --max-memory-restart 300M --node-args="--max_old_space_size=300"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 start futresapi.v2.fovt.js  --max-memory-restart 300M --node-args="--max_old_space_size=1000"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 start futresapi.v2.download.js --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 start futresapi.v3.download.js --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 start adapi.v3.download.js --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 start api.v1.inaan.js --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
