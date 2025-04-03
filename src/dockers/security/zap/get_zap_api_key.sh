#!/bin/bash

# Definir ZAP_ADDRESS y ZAP_PORT
ZAP_ADDRESS="http://localhost"
ZAP_PORT="8081"

# Obtener la API Key de ZAP
ZAP_API_KEY=$(curl -s "$ZAP_ADDRESS:$ZAP_PORT/JSON/core/action/generateApiKey/" | jq -r '.apikey')

# Verificar si se obtuvo correctamente la API Key
if [ -z "$ZAP_API_KEY" ]; then
  echo "Error: No se pudo obtener la API Key de ZAP."
  exit 1
fi

# Exportar la variable
export ZAP_API_KEY="$ZAP_API_KEY"

echo "API Key exportada: $ZAP_API_KEY"