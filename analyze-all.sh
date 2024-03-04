#!/bin/bash

# Get the first day of the last month
first_day_last_month=$(date -d "$(date -d "last month" +%Y-%m-01)" +%F)
# Get the last day of the last month
last_day_last_month=$(date -d "$(date -d "last month" +%Y-%m-01) +1 month -1 day" +%F)
creation_date_seconds=$(date -d "$first_day_last_month" '+%s')
mod_date_seconds=$(date -d "$last_day_last_month" '+%s')
creation_date=$first_day_last_month
mod_date=$last_day_last_month
diff_days=$(( ($mod_date_seconds - $creation_date_seconds)/(60*60*24) ))
output="./log_history/log_history.$last_day_last_month.txt"
touch $output
truncate -s 0 $output

process() {
    local label=$1
    local files_sent=$2
    echo -n "$label," >> $output
    echo -n "$creation_date," >> $output
    echo -n "$mod_date," >> $output 
    echo -n "$diff_days," >>  $output
    echo -n "$files_sent," >>  $output
    if [ $files_sent -ne 0 ]; then
	result=$(echo "scale=1; $files_sent / ($diff_days/30)" | bc)
        echo -n $result >>  $output
    else
        echo -n "0" >>  $output
    fi
    echo "" >> $output
}

# Header
echo "program,start_date,end_date,days,files,average" >> $output

# Futres queries 
files=($(ls -1  /home/exouser/.pm2/logs/futresapi.v1.query-out.log))
for i in "${files[@]}"
do
    files_sent=$(cat "$i" | grep "_search" | grep futres | wc -l)
    process "Futres queries" "$files_sent"
done

# Futres downloads
files=($(ls -1  /home/exouser/.pm2/logs/futresapi.v3.download-out.log))
for i in "${files[@]}"
do
    files_sent=$(cat $i |  grep sent: | sort | uniq | wc -l)
    process "Futres downloads" "$files_sent"
done

# PPO queries
files=($(ls -1  /home/exouser/.pm2/logs/api.v1.query-out.log))
for i in "${files[@]}"
do
    files_sent=$(cat $i |  grep "_search" | wc -l)
    process "ppo queries" "$files_sent"
done

# PPO downloads
files=($(ls -1  /home/exouser/.pm2/logs/api.v3.download-out.log))
for i in "${files[@]}"
do
    files_sent=$(cat $i |  grep sent: | sort | uniq | wc -l)
    process "ppo downloads" "$files_sent"
done
