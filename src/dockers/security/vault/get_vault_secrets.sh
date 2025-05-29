#!/bin/bash

# Configuración segura
export VAULT_ADDR='https://localhost:8200'
export VAULT_ADDR="${VAULT_ADDR:-https://security:8200}"

export VAULT_CACERT='/etc/vault/tls/ca.crt'

# Autenticación con AppRole
ROLE_ID=$(cat /vault/data/role_id.txt)
SECRET_ID=$(cat /vault/data/secret_id.txt)
export VAULT_TOKEN=$(vault write -field=token auth/approle/login role_id="$ROLE_ID" secret_id="$SECRET_ID")

# Validación de token
if ! vault token lookup > /dev/null 2>&1; then
  echo "Error: Token de Vault no válido" >&2
  exit 1
fi

# Obtener secreto
echo "Obteniendo API Key de Vault..."
ZAP_API_KEY=$(vault kv get -field=zap_api_key secret/data/transcendence/api_keys 2>&1)
JWT_SECRET=$(vault kv get -field=jwt_secret secret/data/transcendence/api_keys 2>&1)

if [ $? -eq 0 ]; then
    export ZAP_API_KEY
    echo "API Key exportada correctamente"
else
    echo "Error al obtener API Key: $ZAP_API_KEY" >&2
    echo "Posibles soluciones:"
    echo "1. Verificar que el secreto existe: vault kv get secret/data/transcendence/api_keys"
    echo "2. Verificar permisos del token: vault token capabilities $VAULT_TOKEN secret/data/transcendence/api_keys"
    exit 1
fi