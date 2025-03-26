#!/bin/bash

# Obtener el secreto de Vault
echo "Obteniendo API Key de Vault..."
#API_KEY=$(vault kv get secret/myapp -field=api_key --ca-cert=/zap/wrk/tls/ca.crt)
#API_KEY=$(vault kv get --ca-cert=/zap/wrk/tls/ca.crt -field=api_key secret/myapp)
API_KEY=$(vault kv get -field=api_key secret/data/transcendence/api_keys)

if [ $? -eq 0 ]; then
    export API_KEY
    echo "API Key exportada: $API_KEY"
else
    echo "Error al obtener la API Key de Vault."
    exit 1
fi