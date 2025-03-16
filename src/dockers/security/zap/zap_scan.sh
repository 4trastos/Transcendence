#!/bin/bash

# Definir variables
TARGET_URL="http://frontend:3001"
ZAP_ADDRESS="http://security"
ZAP_PORT="8081"
ZAP_API_KEY="my_zap_api_key"
#ZAP_API_KEY="${ZAP_API_KEY:-my_zap_api_key}"

# Paso 1: Explorar la aplicación
echo "Explorando la aplicación..."
curl -H "X-ZAP-API-Key: $ZAP_API_KEY" "$ZAP_ADDRESS:$ZAP_PORT/JSON/spider/action/scan/?url=$TARGET_URL&recurse=true"

# Esperar a que la exploración termine
echo "Esperando a que la exploración termine..."
while true; do
    STATUS=$(curl -s -H "X-ZAP-API-Key: $ZAP_API_KEY" "$ZAP_ADDRESS:$ZAP_PORT/JSON/spider/view/status/?scanId=0" | jq -r '.status')
    if [ "$STATUS" == "100" ]; then
        break
    fi
    sleep 5
done

# Paso 2: Realizar un escaneo activo
echo "Iniciando escaneo activo en $TARGET_URL utilizando API Key: $ZAP_API_KEY"
curl -H "X-ZAP-API-Key: $ZAP_API_KEY" "$ZAP_ADDRESS:$ZAP_PORT/JSON/ascan/action/scan/?url=$TARGET_URL"

# Esperar a que el escaneo activo termine
echo "Esperando a que el escaneo activo termine..."
while true; do
    STATUS=$(curl -s -H "X-ZAP-API-Key: $ZAP_API_KEY" "$ZAP_ADDRESS:$ZAP_PORT/JSON/ascan/view/status/?scanId=0" | jq -r '.status')
    if [ "$STATUS" == "100" ]; then
        break
    fi
    sleep 5
done

# Paso 3: Descargar el reporte directamente en el volumen compartido
echo "Generando el reporte..."
curl -H "X-ZAP-API-Key: $ZAP_API_KEY" "$ZAP_ADDRESS:$ZAP_PORT/OTHER/core/other/htmlreport/" -o /zap/reports/zap_report.html

echo "Escaneo completado. El reporte está guardado en /zap/reports/zap_report.html"