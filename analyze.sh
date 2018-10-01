#!/bin/sh

# Count searches
echo "************************************************"
echo "* Counting search requests. "
echo "* each source counted as a unique request"
echo "************************************************"
files=($(ls -1  ../../.pm2/logs/es-proxy-out-1.log))
for i in "${files[@]}"
do
    creation_date_seconds=$(date -d "2018-04-02" '+%s')
    mod_date_seconds=$(date -r $i '+%s')
    creation_date=$(date -d "2018-04-02" +%F)
    mod_date=$(date +%F -r $i)
    diff_days=$(( ($mod_date_seconds - $creation_date_seconds)/(60*60*24) ))
    files_sent=$(cat $i |  grep "_search" | wc -l)
    echo "file: $i"
    echo "creation date: $creation_date"
    echo "last mod date: $mod_date"
    echo "days counted: $diff_days"
    echo "search requests: $files_sent"
    echo "search requests/month: $(( $files_sent / ($diff_days/30) ))"
done

echo ""


# Count downloads
echo "************************************************"
echo "* Counting download requests"
echo "************************************************"
files=($(ls -1  ../../.pm2/logs/download-proxy-v2-out-2.log))
for i in "${files[@]}"
do
    creation_date_seconds=$(date -d "2018-04-02" '+%s')
    mod_date_seconds=$(date -r $i '+%s')
    creation_date=$(date -d "2018-04-02" +%F)
    mod_date=$(date +%F -r $i)
    diff_days=$(( ($mod_date_seconds - $creation_date_seconds)/(60*60*24) ))
    files_sent=$(cat $i |  grep sent: | sort | uniq | wc -l)
    echo "file: $i"
    echo "creation date: $creation_date"
    echo "last mod date: $mod_date"
    echo "days counted: $diff_days"
    echo "download requests: $files_sent"
    echo "download requests/month: $(( $files_sent / ($diff_days/30) ))"
done

