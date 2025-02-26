#!/bin/bash

# Obtener la API Key de ZAP
ZAP_API_KEY=$(curl -s "$ZAP_ADDRESS:$ZAP_PORT/JSON/core/action/generateApiKey/")

# Exportar la variable
export ZAP_API_KEY="$ZAP_API_KEY"

echo "API Key exportada: $ZAP_API_KEY"