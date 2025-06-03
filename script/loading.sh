#!/bin/bash

URL_ZAP="http://localhost:8081/"
URL_KIBANA="https://localhost:5601/login"

# Verifica si ZAP está listo
check_zap_ready() {
  local response=$(curl -s "$URL_ZAP")
  [[ "$response" == *"<title>ZAP API UI</title>"* ]]
}

# Verifica si Kibana está listo
check_kibana_ready() {
  docker logs --tail 1000 kibana 2>&1 | grep -q "Kibana is now available"
}

# Verifica si Elasticsearch está healthy
check_elasticsearch_ready() {
  local status=$(docker inspect --format='{{.State.Health.Status}}' elasticsearch 2>/dev/null)
  [[ "$status" == "healthy" ]]
}

center_text() {
  local text="$1"
  local cols=$(tput cols)
  local padding=$(( (cols - ${#text}) / 2 ))
  printf "%*s%s\n" "$padding" "" "$text"
}

# Estado inicial de los servicios
services_names=(
  "app (backend)"
  "elasticsearch"
  "frontend"
  "grafana"
  "kibana"
  "logstash"
  "mailserver"
  "php"
  "prometheus"
  "security"
  "sqlite"
)

services_status=()
for s in "${services_names[@]}"; do
  services_status+=("❌")
done

update_static_services() {
  for i in "${!services_names[@]}"; do
    name="${services_names[$i]}"
    if [[ "$name" == "kibana" || "$name" == "security" || "$name" == "elasticsearch" ]]; then
      continue
    fi
    services_status[$i]="✅"
    draw_status_board
    sleep 0.4
  done
}

draw_status_board() {
  local rows=$(tput lines)
  local center_row=$((rows / 2 - 3))
  tput cup $center_row 0

  center_text "🚀 Initializing services... Please wait! 🚀"
  center_text ""
  center_text "Service status:"

  local status_row=$((center_row + 3))

  for i in "${!services_names[@]}"; do
    tput cup $((status_row + i)) 0
    local name="${services_names[$i]}"
    local status="${services_status[$i]}"

    if [[ "$name" == "kibana" ]]; then
      if check_kibana_ready; then
        status="✅"
        services_status[$i]="✅"
      fi
    elif [[ "$name" == "security" ]]; then
      if check_zap_ready; then
        status="✅"
        services_status[$i]="✅"
      fi
    elif [[ "$name" == "elasticsearch" ]]; then
      if check_elasticsearch_ready; then
        status="✅"
        services_status[$i]="✅"
      fi
    fi

    center_text "[$status] $name"
  done
}

loading_bar() {
  local progress=0
  local bar_length=80
  local rows=$(tput lines)
  local center_row=$((rows / 2 + 15))

  tput civis
  update_static_services
  while ! (check_zap_ready && check_kibana_ready && check_elasticsearch_ready); do
    tput cup $center_row 0
    local bar="["
    for ((i = 0; i < bar_length; i++)); do
      if [ $i -lt $progress ]; then
        bar+="█"
      else
        bar+="-"
      fi
    done
    bar+="]"
    center_text "$bar"
    draw_status_board
    progress=$(( (progress + 1) % (bar_length + 1) ))
    sleep 0.8
  done
  tput cnorm
}

url_ready() {
  clear
  local rows=$(tput lines)
  local center_row=$((rows / 2))
  tput cup $center_row 0
  center_text "✅ ALL SERVICES are available! - ENJOY THE EXPERIENCE ✅"
  sleep 2
}

clear
loading_bar
url_ready