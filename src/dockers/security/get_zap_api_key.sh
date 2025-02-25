#!/bin/bash
set -eu

# Obtener la API Key del archivo de configuración de ZAP
ZAP_API_KEY=$(cat /root/.ZAP/config.xml | grep "<key>" | sed -e 's/<key>//' -e 's/<\/key>//')

# Exportar la variable
export ZAP_API_KEY="$ZAP_API_KEY"

echo "API Key exportada: $ZAP_API_KEY"