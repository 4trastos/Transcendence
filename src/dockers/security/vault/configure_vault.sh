#!/bin/bash
# Script: configure_vault.sh
# Propósito: Contiene la lógica para la configuración inicial y completa de Vault
# (habilitar motores, crear políticas, roles AppRole, tokens de UI, etc.).
# Este script es llamado desde el entrypoint.sh del contenedor security.

echo "Iniciando configuración COMPLETA de Vault..."

# Exportar variables críticas para Vault, si no están ya configuradas por el entrypoint principal.
export VAULT_ADDR='https://security:8200'
export VAULT_CACERT='/etc/vault/tls/ca.crt'

# Asegurarse de que el token de root o un token con permisos suficientes esté disponible
if [ -z "$VAULT_TOKEN" ]; then
    echo "ERROR: VAULT_TOKEN no está definido. No se puede configurar Vault."
    exit 1
fi

# 1. Habilitar motor KV v2 (si no está ya habilitado)
vault secrets enable -path=secret kv-v2 || true
echo "Motor KV v2 habilitado/verificado."

# 2. Crear políticas
if [ ! -f "/etc/vault/policy.hcl" ]; then echo "ERROR: Archivo de política /etc/vault/policy.hcl no encontrado."; exit 1; fi
vault policy write transcendence /etc/vault/policy.hcl
echo "Política 'transcendence' creada/actualizada."

if [ ! -f "/etc/vault/prometheus.hcl" ]; then echo "ERROR: Archivo de política /etc/vault/prometheus.hcl no encontrado."; exit 1; fi
vault policy write prometheus /etc/vault/prometheus.hcl
echo "Política 'prometheus' creada/actualizada."

# 3. Crear secretos iniciales
echo "Creando/actualizando secretos iniciales..."
# NOTA: Los valores aquí son solo iniciales.
# Si quieres que se randomicen en cada arranque, podemos usar tu script update_dynamic_secrets.sh después.
vault kv put secret/transcendence/database \
    username="db_admin" \
    password="$(openssl rand -base64 16)"

vault kv put secret/transcendence/api_keys \
    zap_api_key="${ZAP_API_KEY:-my_zap_api_key}" \
    jwt_secret="skwkD5gSIYNOWxyyLjSprTq9UvviwFyez6zK018ss6s="

vault kv put secret/transcendence/auth \
    jwt_expires_in="1h" \
    refresh_expires_in="7d" \
    twofa_expires="15m"
echo "Secretos iniciales creados/actualizados."

# 4. Configurar autenticación AppRole
echo "Configurando método de autenticación AppRole..."
vault auth enable approle || true
vault write auth/approle/role/transcendence-app \
    secret_id_ttl="24h" \
    token_ttl=1h \
    token_max_ttl=2h \
    policies="transcendence" \
    bind_secret_id=true \
    token_type="service"
echo "Rol 'transcendence-app' de AppRole configurado."

# 5. Generar credenciales iniciales para AppRole
echo "Generando credenciales AppRole (Role ID y Secret ID)..."
ROLE_ID=$(vault read -field=role_id auth/approle/role/transcendence-app/role-id)
SECRET_ID=$(vault write -f -field=secret_id auth/approle/role/transcendence-app/secret-id)

echo "$ROLE_ID" > /vault/data/role_id.txt
echo "$SECRET_ID" > /vault/data/secret_id.txt
chmod 600 /vault/data/secret_id.txt
echo "Credenciales AppRole guardadas en /vault/data."

# 6. Generar token para UI y asegurar su persistencia
echo "Generando o verificando token para UI..."
TOKEN_FILE="/vault/data/ui_token.txt"
RETRY_COUNT=0
MAX_RETRIES=10
RETRY_DELAY=5 # segundos

while [ ! -s "$TOKEN_FILE" ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Intentando generar token de UI (intento $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
    if vault token create -policy="transcendence" -ttl="${VAULT_TOKEN_TTL}" -field=token > "$TOKEN_FILE"; then
        echo "✅ Token de UI generado con éxito."
        chmod 644 "$TOKEN_FILE"
        break
    else
        echo "❌ Error al generar el token de UI. Reintentando en $RETRY_DELAY segundos..."
        rm -f "$TOKEN_FILE"
        sleep $RETRY_DELAY
        RETRY_COUNT=$((RETRY_COUNT + 1))
    fi
done

if [ ! -s "$TOKEN_FILE" ]; then
    echo "🚨 ERROR FATAL: No se pudo generar el token de UI después de $MAX_RETRIES intentos."
    exit 1
fi
echo "Token de UI configurado."

# 7. Crear token para Prometheus y guardarlo
echo "Generando token para Prometheus..."
mkdir -p /vault/data/prometheus
if vault token create -policy=prometheus -ttl=24h -renewable=true -format=json > /tmp/prom_token.json; then
    jq -r .auth.client_token /tmp/prom_token.json > /vault/data/prometheus/token.txt
    chmod 644 /vault/data/prometheus/token.txt
    rm /tmp/prom_token.json
    echo "Token de Prometheus generado en /vault/data/prometheus/token.txt."
else
    echo "❌ Error al crear token para Prometheus."
    exit 1
fi

# 8. Configurar autenticación userpass
echo "Configurando método de autenticación userpass..."
vault auth enable userpass || true
if ! vault read auth/userpass/users/transcendence-admin > /dev/null 2>&1; then
    echo "Creando usuario 'transcendence-admin'..."
    vault write auth/userpass/users/transcendence-admin \
        password="$(openssl rand -base64 12)" \
        policies="transcendence"
else
    echo "Usuario 'transcendence-admin' ya existe."
fi
echo "Autenticación userpass configurada."

# 9. Crear token para ZAP reporter y guardarlo
echo "Generando token para ZAP Reporter..."
mkdir -p /vault/data/zap
if vault token create -policy=zap-reporter -ttl=12h -renewable=true -format=json > /tmp/zap_token.json; then
    jq -r .auth.client_token /tmp/zap_token.json > /vault/data/zap/token.txt
    chmod 644 /vault/data/zap/token.txt
    rm /tmp/zap_token.json
    echo "Token de ZAP Reporter generado en /vault/data/zap/token.txt."
else
    echo "❌ Error al crear token para ZAP Reporter."
    exit 1
fi

#10 Mover TODOS los secretos a Vault:
vault kv put secret/transcendence/oauth \
  google_client_id="1016434618199-4smnonv5e6qqedmone3vrtqgngn8shnb.apps.googleusercontent.com" \
  google_client_secret="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"

vault kv put secret/transcendence/email \
  user="adrianherrera.r.e@gmail.com" \
  pass="vmzz ezsu crtz evsg" \
  host="mailserver" \
  port=1025

vault kv put secret/transcendence/app \
  session_secret="veevsgzsuevsgcrtevsgzevsgevsgmzzevsg" \
  bcrypt_salt_rounds=12


echo "Configuración inicial de Vault completada exitosamente."