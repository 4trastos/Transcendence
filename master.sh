#!/bin/bash

declare -A ips
declare -A containers
all_ips=""
for arg in "$@"; do
  case $arg in
    ip*)
      key="${arg%%=*}"          # extrae 'ip1', 'ip2', etc
      value="${arg#*=}"         # extrae el valor después de '='
      ips[$key]="$value"
      all_ips+="${ips[$key]} "
      ;;
    c*)
      key="${arg%%=*}"          # extrae 'c1', 'c2', etc
      value="${arg#*=}"
      containers[$key]="$value"
      ;;
  esac
done


#COmprimo lo que voy a enviar

tar -czf dockers.tar.gz src/dockers src/docker-compose.yml src/.env
#Abro un servicio que envia el archivo
echo "$all_ips"
node server.js $all_ips &
NODE_SRV=$!
LOCAL_IP=$(ip addr show enp4s0f0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)

sleep 2

# Listar todas las IPs y contenedores ordenados por índice
for key in "${!ips[@]}"; do
  # Sacar solo el número (por ejemplo, de 'ip1' -> '1')
  index="${key//ip/}"
  ip="${ips[$key]}"
  container="${containers[c$index]}"
  WORKER="ip=\"$ip\" c=\"$container\""

  #TEngo que hacer que ejecute un Script y se mantenga en escucha, compruebe que el servicio esta corriendo y si cae que lo levante nuevamente. en otra ubicacion,

  #
  CMD="wget -q --server-response http://$LOCAL_IP:8000/worker.sh -O worker.sh && chmod +x worker.sh && ./worker.sh $WORKER IPS=$LOCAL_IP && exit"
  MAX_RETRIES=3
  SLEEP_TIME=1

  ## Hago un reverse shell y que ejecute un script, SI hago exit sale de nc
  for i in $(seq 1 $MAX_RETRIES); do
    echo "Intento $i de $MAX_RETRIES..."

    RESPONSE=$(echo "$CMD" | nc -lnv 9001)

    echo "Respuesta recibida:"
    echo "$RESPONSE"

    if [[ "$RESPONSE" =~ "Started" || "$RESPONSE" =~ "Running" ]]; then
      echo "✅ El cliente ejecutó wget con éxito"
      break
    else
      echo "❌ El cliente falló o no respondió correctamente"
      echo "Esperando $SLEEP_TIME segundos antes del próximo intento..."
      sleep $SLEEP_TIME
    fi
  done


done

kill $NODE_SRV;
