#!/bin/bash
echo "service,build_time_seconds" > build_times.csv
for service in $(docker compose config --services); do
  start=$(date +%s.%N)
  docker compose build "$service" > /dev/null
  end=$(date +%s.%N)
  duration=$(echo "$end - $start" | bc)
  echo "$service,$duration" >> build_times.csv
done
