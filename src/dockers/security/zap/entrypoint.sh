#!/bin/bash

# Iniciar Apache con ModSecurity
service apache2 start

# Iniciar HashiCorp Vault en modo desarrollo, escuchando en 0.0.0.0
vault server -dev -dev-listen-address="0.0.0.0:8200" &

# Esperar a que Vault esté listo
sleep 5

# Configurar Vault
export VAULT_ADDR='http://0.0.0.0:8200'
vault kv put secret/myapp api_key=my_secret_key

# Iniciar OWASP ZAP con la API Key
ZAP_API_KEY="${ZAP_API_KEY:-my_zap_api_key}"
/zap/zap.sh -daemon -host 0.0.0.0 -port 8081 -config api.key=$ZAP_API_KEY -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true

# Esperar a que ZAP esté listo
echo "Esperando a que ZAP inicie..."
while ! curl -fs "http://localhost:8081/JSON/core/view/version/" > /dev/null 2>&1; do
    echo "Esperando..."
    sleep 10
done

# Ejecutar el script de escaneo de ZAP
export ZAP_API_KEY="$ZAP_API_KEY"
/zap/wrk/zap_scan.sh

# Mantener el contenedor en ejecución
tail -f /dev/null