#!/bin/bash

echo "Iniciando entrypoint.sh"

# Iniciar ZAP en segundo plano
/zap/zap.sh -daemon -host 0.0.0.0 -port 8081 &

echo "ZAP iniciado en segundo plano. PID: $!"

# Esperar a que ZAP esté listo (revisando el puerto)
echo "Esperando a que ZAP esté listo..."
while ! nc -z localhost 8081 2>/dev/null; do
    echo "Esperando..."
    sleep 5
done

echo "ZAP está listo."

# Ejecutar get_zap_api_key.sh
echo "Ejecutando /zap/wrk/get_zap_api_key.sh"
/zap/wrk/get_zap_api_key.sh
ret=$?
echo "get_zap_api_key.sh completado con código de retorno: $ret"

if [[ $ret -ne 0 ]]; then
    echo "Error: get_zap_api_key.sh falló. Saliendo."
    exit $ret
fi

# Ejecutar zap_scan.sh (asegúrate de que este script use $ZAP_API_KEY)
echo "Ejecutando /zap/wrk/zap_scan.sh"
/zap/wrk/zap_scan.sh
ret=$?
echo "zap_scan.sh completado con código de retorno: $ret"

if [[ $ret -ne 0 ]]; then
    echo "Error: zap_scan.sh falló. Saliendo."
    exit $ret
fi

echo "entrypoint.sh completado."

# Mantener el contenedor en ejecución
tail -f /dev/null