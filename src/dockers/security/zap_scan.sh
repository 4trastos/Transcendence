#!/bin/bash

TARGET_URL="http://localhost:3001"

ZAP_ADDRESS="http://security"
ZAP_PORT="8081"

# Esperar a que ZAP esté listo (usando la variable de entorno)
for i in {1..20}; do
    curl -fs -H "X-ZAP-API-Key: $ZAP_API_KEY" "$ZAP_ADDRESS:8081/JSON/core/view/version/" > /dev/null 2>&1
    if [[ $? -eq 0 ]]; then
        echo "ZAP está listo."
        break
    else
        echo "Esperando a que ZAP inicie... Intento $i/20"
        sleep 10
    fi
done

if [[ $i -eq 20 ]]; then  # Si el bucle terminó sin éxito
    echo "Error: ZAP no se inició después de 10 intentos."
    exit 1  # Salir del script con un código de error
fi

sleep 5

# Iniciar un escaneo pasivo - Incluir API Key
curl -H "X-ZAP-API-Key: $ZAP_API_KEY" "$ZAP_ADDRESS:$ZAP_PORT/JSON/ascan/action/scan/?url=$TARGET_URL"

# Descargando resultados - Incluir API Key
curl -H "X-ZAP-API-Key: $ZAP_API_KEY" "$ZAP_ADDRESS:$ZAP_PORT/OTHER/core/other/htmlreport/" -o zap_report.html

echo "Escaneo completado. El reporte está guardado en zap_report.html"