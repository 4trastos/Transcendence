#!/bin/bash

DOCKER_PID=$(ps aux | grep '[c]om.docker.backend run' | awk '{print $2}')

if [ -z "$DOCKER_PID" ]; then
    echo "No se encontró el proceso de Docker."
else
    echo "Proceso de Docker encontrado con PID: $DOCKER_PID"
    echo "Matando el proceso..."
    kill "$DOCKER_PID"
    
    if [ $? -eq 0 ]; then
        echo "Proceso de Docker terminado correctamente."
    else
        echo "Error al intentar matar el proceso de Docker."
    fi
fi

echo "Esperando unos segundos para asegurar que Docker se haya detenido..."
sleep 5

echo "Intentando abrir Docker..."
open /Applications/Docker.app || \
    echo "Error al intentar abrir Docker. Intentando con osascript..."; \
    osascript -e 'tell application "Docker" to activate'

echo "Esperando a que Docker se inicie..."
sleep 10
while ! docker ps > /dev/null 2>&1; do
    echo "Esperando que Docker esté listo..."
    sleep 5
done

echo "Docker está listo."
