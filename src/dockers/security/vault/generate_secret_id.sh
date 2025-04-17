#!/bin/bash

# Configuración
VAULT_ADDR='https://localhost:8200'
VAULT_TOKEN_FILE='/vault/data/ui_token.txt'
SECRET_ID_FILE='/vault/data/secret_id.txt'

# Validar existencia de archivos
[ -f "$VAULT_TOKEN_FILE" ] || { echo "Error: No existe $VAULT_TOKEN_FILE"; exit 1; }

#export VAULT_TOKEN=$(cat "$VAULT_TOKEN_FILE")
VAULT_TOKEN=$(cat "$VAULT_TOKEN_FILE")

# Generar nuevo secret_id con validación
if SECRET_ID=$(vault write -f -field=secret_id auth/approle/role/transcendence-app/secret-id); then
    echo "$SECRET_ID" > "$SECRET_ID_FILE"
    chmod 600 "$SECRET_ID_FILE"
    echo "$(date) - Nuevo secret_id generado" >> /var/log/vault_secret_rotation.log
else
    echo "Error al generar secret_id" >&2
    exit 1
fi