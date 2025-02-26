#!/bin/bash

TARGET_URL="http://localhost:3001"
ZAP_ADDRESS="http://localhost"
ZAP_PORT="8081"
ZAP_API_KEY="my_zap_api_key"

# Ejecutar un escaneo básico
curl -H "X-ZAP-API-Key: $ZAP_API_KEY" "$ZAP_ADDRESS:$ZAP_PORT/JSON/ascan/action/scan/?url=$TARGET_URL"

# Descargar el reporte
curl -H "X-ZAP-API-Key: $ZAP_API_KEY" "$ZAP_ADDRESS:$ZAP_PORT/OTHER/core/other/htmlreport/" -o zap_report.html

echo "Escaneo completado. El reporte está guardado en zap_report.html"