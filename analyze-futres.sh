#!/bin/bash

# Count searches
echo "************************************************"
echo "* Counting search requests. "
echo "* each source counted as a unique request"
echo "************************************************"
files=($(ls -1  ../../.pm2/logs/api.v1.query-out.log))
for i in "${files[@]}"
do
    creation_date_seconds=$(date -d "2021-08-03" '+%s')
    mod_date_seconds=$(date -r $i '+%s')
    creation_date=$(date -d "2021-08-03" +%F)
    mod_date=$(date +%F -r $i)
    diff_days=$(( ($mod_date_seconds - $creation_date_seconds)/(60*60*24) ))
    futres_files_sent=$(cat $i |  grep "_search" | grep futres | wc -l)
    echo "file: $i"
    echo "creation date: $creation_date"
    echo "last mod date: $mod_date"
    echo "days counted: $diff_days"
    echo "total search requests: $futres_files_sent"
    echo "average search requests/month: $(( $futres_files_sent / ($diff_days/30) ))"
done

echo ""


# Count downloads
echo "************************************************"
echo "* Counting download requests"
echo "************************************************"
files=($(ls -1  ../../.pm2/logs/futresapi.v3.download-out.log))
for i in "${files[@]}"
do
    creation_date_seconds=$(date -d "2021-08-04" '+%s')
    mod_date_seconds=$(date -r $i '+%s')
    creation_date=$(date -d "2021-08-04" +%F)
    mod_date=$(date +%F -r $i)
    diff_days=$(( ($mod_date_seconds - $creation_date_seconds)/(60*60*24) ))
    files_sent=$(cat $i |  grep sent: | sort | uniq | wc -l)
    echo "file: $i"
    echo "creation date: $creation_date"
    echo "last mod date: $mod_date"
    echo "days counted: $diff_days"
    echo "download requests: $files_sent"
    echo "average download requests/month: $(( $files_sent / ($diff_days/30) ))"
done

