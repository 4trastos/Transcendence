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

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m" #

PID=$(lsof -i :8000 -t)
PID_NC=$(lsof -i :9001 -t)
if [ -n "$PID" ]; then
    echo "Matar el proceso con PID: $PID"
    kill -9 $PID
else
    echo "No se encontró ningún proceso utilizando el puerto 8000"
fi
if [ -n "$PID_NC" ]; then
    echo "Matar el proceso con PID: $PID_NC"
    kill -9 $PID_NC
else
    echo "No se encontró ningún proceso utilizando el puerto 9001"
fi
#COmprimo lo que voy a enviar
LOCAL_IP=$(ip addr show enp4s0f0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)

tar -czf dockers.tar.gz src/dockers src/docker-compose.yml src/.env
#Abro un servicio que envia el archivo
echo "$all_ips"
node server.js $all_ips $LOCAL_IP &
NODE_SRV=$!

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
  CMD="{
  wget -q --server-response http://$LOCAL_IP:8000/worker.sh -O worker.sh &&
  chmod +x worker.sh &&
  ./worker.sh "$WORKER" IPS="$LOCAL_IP"
} > logs 2>&1 &"
  MAX_RETRIES=3
  SLEEP_TIME=1

  ## Hago un reverse shell y que ejecute un script, SI hago exit sale de nc
  for i in $(seq 1 $MAX_RETRIES); do
    echo "Intento $i de $MAX_RETRIES: ${ips[$key]}"

    # Ejecuta el comando y recibe la salida
    tail -f "input-wrk[$key]" |  nc -lnv 9001 | tee "output-wrk[$key]" &
    echo "$CMD" > "input-wrk[$key]" #SI le agrego un & a CMD lo dejo en segundo plano y puedo seguir ejecutando cosas. de todas formas finalizara su proceso enviandome su ultimo estado.
    NC_PID=$!
    echo -e "${BLUE}El PID de nc es: $NC_PID${RESET}"

    while true; do
      # Guardamos la salida en RESPONSE
      RESPONSE=$( echo "tail -n 1 logs" >> "input-wrk[$key]" && tail -n 1 "output-wrk[$key]")
      
      # Colorear la salida según el contenido
      if [[ "$RESPONSE" == "200 OK" ]]; then
          echo -e "${GREEN}$RESPONSE${RESET}"  # 200 OK en verde
      elif [[ "$RESPONSE" == "403 OK" ]]; then
          echo -e "${GREEN}$RESPONSE${RESET}"  # 200 OK en verde
          kill $NODE_SRV;
          kill $NC_PID
          exit
      elif [[ "$RESPONSE" == "Started" ]]; then
          echo -e "${BLUE}$RESPONSE${RESET}"  # Started en azul
          echo -e "${YELLOW}Estado 'Started' recibido. Saliendo del bucle...${RESET}"
          break # Salir del bucle exterior
      elif [[ "$RESPONSE" == "EXIT" ]]; then
          break 
      else
          echo -ne "$RESPONSE\r"  # 200 OK en verde
      fi
      sleep 1;
    done

    if [[ "$RESPONSE" =~ "Started" || "$RESPONSE" =~ "Running" ]]; then
      echo "✅ El cliente ejecutó wget con éxito"
      break
    else
      echo -e "❌${RED}El cliente falló o no respondió correctamente"
      echo -e "Esperando $SLEEP_TIME segundos antes del próximo intento...${RESET}"
      sleep $SLEEP_TIME
    fi
  done
  echo -e "Saliendo"
done


PID=$(lsof -i :8000 -t)
PID_NC=$(lsof -i :9001 -t)
if [ -n "$PID" ]; then
    echo "Matar el proceso con PID: $PID"
    kill -9 $PID
else
    echo "No se encontró ningún proceso utilizando el puerto 8000"
fi
if [ -n "$PID_NC" ]; then
    echo "Matar el proceso con PID: $PID_NC"
    kill -9 $PID_NC
else
    echo "No se encontró ningún proceso utilizando el puerto 9001"
fi