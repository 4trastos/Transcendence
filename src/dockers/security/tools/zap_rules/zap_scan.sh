#!/bin/bash

# URL del objetivo que deseas escanear
TARGET_URL="http://tuapp.local"

# Dirección y puerto de OWASP ZAP (esto depende de tu configuración)
ZAP_ADDRESS="http://localhost"
ZAP_PORT="8081"

# Iniciar un escaneo pasivo
echo "Iniciando escaneo pasivo..."
curl "$ZAP_ADDRESS:$ZAP_PORT/JSON/ascan/action/scan/?url=$TARGET_URL"

# Puedes esperar a que termine el escaneo si quieres
# sleep 10  # Esperar 10 segundos para que el escaneo progrese

# Descargamos los resultados del escaneo
echo "Descargando resultados..."
curl "$ZAP_ADDRESS:$ZAP_PORT/OTHER/core/other/htmlreport/" -o zap_report.html

echo "Escaneo completado. El reporte está guardado en zap_report.html"
