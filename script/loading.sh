#!/bin/bash

URL="http://localhost:8081/"

check_url_ready() {
  RESPONSE=$(curl -s "$URL")
  if [[ "$RESPONSE" == *"<title>ZAP API UI</title>"* ]]; then
    return 0
  else
    return 1
  fi
}

loading_bar() {
  local progress=0
  local bar_length=80
  while ! check_url_ready; do
    echo -ne "\rCHECKING IF ALL SERVICES ARE OPERATIONAL ["
    for ((i = 0; i < bar_length; i++)); do
      if [ $i -lt $progress ]; then
        echo -n "█"
      else
        echo -n "-"
      fi
    done
    echo -n "]"
    progress=$(( (progress + 1) % (bar_length + 1) ))
    echo -n " PLEASE WAIT..."
    sleep 1
  done
}

url_ready() {
  echo -e "\n"  
  echo -e "\n✅ ALL SERVICES are available! - ENJOY THE EXPERIENCE ✅"
  sleep 2
}

loading_bar
url_ready