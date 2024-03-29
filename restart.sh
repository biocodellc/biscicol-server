#!/bin/sh
pm2 restart api.v1.query.js --update-env --max-memory-restart 300M --node-args="--max_old_space_size=300"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 restart api.v1.ppo.js  --update-env --max-memory-restart 300M --node-args="--max_old_space_size=1000"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 restart api.v2.ppo.js --update-env --max-memory-restart 1000M --node-args="--max_old_space_size=1000"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 restart api.v2.download.js --update-env --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 restart api.v3.download.js --update-env --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 restart futresapi.v1.query.js  --update-env --max-memory-restart 300M --node-args="--max_old_space_size=1000"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 restart futresapi.v2.fovt.js  --update-env --max-memory-restart 300M --node-args="--max_old_space_size=1000"  --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 restart futresapi.v2.download.js --update-env --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 restart futresapi.v3.download.js --update-env --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 restart adapi.v3.download.js --update-env --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z" 
pm2 restart api.v1.inaan.js --max-memory-restart 1000M --node-args="--max_old_space_size=1000" --log-date-format="YYYY-MM-DD HH:mm Z"
