#!/bin/bash

# Verificar si es entorno de producción
if [ "$ENVIRONMENT" = "production" ]; then
    export VAULT_TOKEN_TTL="1h"
    export VAULT_SECRET_ID_TTL="24h"
else
    export VAULT_TOKEN_TTL="24h"
    export VAULT_SECRET_ID_TTL="720h"
fi

# =============================================
# CONFIGURACIÓN DE DIRECTORIOS Y CERTIFICADOS
# =============================================

# 1. Crear estructura de directorios
mkdir -p \
  /etc/vault/tls \
  /zap/wrk/tls \
  /etc/nginx/certs

# 2. Generar CA raíz si no existe
if [ ! -f "/etc/vault/tls/ca.crt" ]; then
  echo "Generando nueva CA raíz..."
  openssl genrsa -out /etc/vault/tls/ca.key 4096
  openssl req -x509 -new -nodes -key /etc/vault/tls/ca.key \
    -sha256 -days 3650 -out /etc/vault/tls/ca.crt \
    -subj "/CN=Transcendence Internal CA"
fi

# 3. Generar certificado del servidor
echo "Generando certificado TLS..."
openssl req -newkey rsa:4096 -nodes \
  -keyout /etc/vault/tls/key.pem \
  -out /etc/vault/tls/cert.csr \
  -subj "/CN=transcendence" \
  -config /zap/wrk/openssl.cnf

# 4. Firmar certificado con SANs
openssl x509 -req -in /etc/vault/tls/cert.csr \
  -CA /etc/vault/tls/ca.crt \
  -CAkey /etc/vault/tls/ca.key \
  -CAcreateserial \
  -out /etc/vault/tls/cert.pem \
  -days 365 -sha256 \
  -extfile /zap/wrk/openssl.cnf \
  -extensions v3_ca

# Configurar nombre de host para resolución interna
echo "127.0.0.1 security security.transcendence" >> /etc/hosts

# Configurar variables de entorno para curl
echo "export CURL_CA_BUNDLE=/etc/vault/tls/ca.crt" >> /root/.bashrc
echo "export REQUESTS_CA_BUNDLE=/etc/vault/tls/ca.crt" >> /root/.bashrc

# Configurar CA como confiable
echo "Configurando CA como confiable..."
cp /etc/vault/tls/ca.crt /usr/local/share/ca-certificates/
update-ca-certificates --fresh
chmod 644 /etc/ssl/certs/*.pem

# Exportar variables críticas para Vault
export VAULT_ADDR='https://security:8200'
export VAULT_CACERT='/etc/vault/tls/ca.crt'

# 5. Preparar certificados para otros servicios
echo "Preparando certificados compartidos..."

# Para ZAP (enlace simbólico)
ln -sf /etc/vault/tls /zap/wrk/tls

# Para Nginx (bundle completo)
cat /etc/vault/tls/cert.pem /etc/vault/tls/ca.crt > /etc/nginx/certs/bundle.pem
cp /etc/vault/tls/key.pem /etc/nginx/certs/key.pem
cp /etc/vault/tls/ca.crt /etc/nginx/certs/ca.crt

# 6. Configurar permisos
chmod 644 /etc/vault/tls/*.crt /etc/vault/tls/*.pem
chmod 600 /etc/vault/tls/*.key
chmod 755 /etc/vault/tls /zap/wrk/tls /etc/nginx/certs

# =============================================
# CONFIGURACIÓN COMPLETA DE VAULT
# =============================================

echo "Iniciando Vault..."
vault server -config=/etc/vault/vault.hcl &

# Esperar inicialización
sleep 5

# Función para inicializar Vault
init_vault() {
    echo "Inicializando Vault por primera vez..."
    vault operator init -key-shares=1 -key-threshold=1 > /tmp/vault-init.txt
    UNSEAL_KEY=$(grep "Unseal Key" /tmp/vault-init.txt | awk '{print $4}')
    ROOT_TOKEN=$(grep "Root Token" /tmp/vault-init.txt | awk '{print $4}')
    
    echo "$UNSEAL_KEY" > /vault/data/unseal_key.txt
    echo "$ROOT_TOKEN" > /vault/data/root_token.txt
    touch /vault/data/initialized
    
    # Configurar entorno
    export VAULT_TOKEN="$ROOT_TOKEN"
    
    # Desbloquear Vault
    vault operator unseal $UNSEAL_KEY
    
    # Habilitar audit logging
    vault audit enable file file_path=/vault/data/audit.log
    
    # Configuración básica
    configure_vault
}

# Después de init_vault()
    backup_vault_credentials() {
    echo "Backup de credenciales críticas..."
    tar czf /vault/backup/vault_credentials_$(date +%Y%m%d).tar.gz \
        /vault/data/unseal_key.txt \
        /vault/data/root_token.txt \
        /vault/data/role_id.txt
    chmod 600 /vault/backup/*.tar.gz
}

# Función para configuración automática
configure_vault() {
    echo "Configurando políticas y secretos..."
    
    # 1. Habilitar motor KV v2
    vault secrets enable -path=secret kv-v2
    
    # 2. Crear políticas
    vault policy write transcendence /etc/vault/policy.hcl
    echo "Configurando política para Prometheus..."
    vault policy write prometheus /etc/vault/prometheus.hcl
    
    # 3. Crear secretos iniciales
    vault kv put secret/transcendence/database \
        username="db_admin" \
        password="$(openssl rand -base64 16)"
    
    vault kv put secret/transcendence/api_keys \
        zap_api_key="${ZAP_API_KEY:-my_zap_api_key}" \
        jwt_secret="$(openssl rand -base64 32)"

    vault kv put secret/transcendence/auth \
        jwt_expires_in="1h" \
        refresh_expires_in="7d" \
        twofa_expires="15m"
    
   # 4. Configurar autenticación AppRole (versión mejorada)
    vault auth enable approle
    vault write auth/approle/role/transcendence-app \
        secret_id_ttl=0 \
        token_ttl=1h \
        token_max_ttl=2h \
        policies="transcendence" \
        bind_secret_id=true \
        token_type="service"

    # 5. Generar credenciales iniciales
    echo "Generando credenciales AppRole..."
    ROLE_ID=$(vault read -field=role_id auth/approle/role/transcendence-app/role-id)
    SECRET_ID=$(vault write -f -field=secret_id auth/approle/role/transcendence-app/secret-id)

    # Guardar credenciales con permisos seguros
    echo "$ROLE_ID" > /vault/data/role_id.txt
    echo "$SECRET_ID" > /vault/data/secret_id.txt
    chmod 600 /vault/data/secret_id.txt
    
    # 6. Generar token para UI y asegurar su persistencia
    echo "Generando o verificando token para UI..."
    TOKEN_FILE="/vault/data/ui_token.txt"
    RETRY_COUNT=0
    MAX_RETRIES=10
    RETRY_DELAY=5 # segundos

    # Bucle para intentar generar el token hasta que exista y no esté vacío
    while [ ! -s "$TOKEN_FILE" ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if vault token create -policy="transcendence" -ttl="${VAULT_TOKEN_TTL}" -field=token > "$TOKEN_FILE"; then
            echo "✅ Token de UI generado con éxito en el intento $((RETRY_COUNT + 1))."
            chmod 644 "$TOKEN_FILE"
            break # Salir del bucle si el token se generó con éxito
        else
            echo "❌ Error al generar el token de UI (intento $((RETRY_COUNT + 1))/$MAX_RETRIES). Reintentando en $RETRY_DELAY segundos..."
            rm -f "$TOKEN_FILE" # Limpiar archivo potencialmente corrupto/vacío
            sleep $RETRY_DELAY
            RETRY_COUNT=$((RETRY_COUNT + 1))
        fi
    done

    if [ ! -s "$TOKEN_FILE" ]; then
        echo "🚨 ERROR FATAL: No se pudo generar el token de UI después de $MAX_RETRIES intentos. Verificar la configuración de Vault o los recursos del sistema."
        exit 1 # Salir si el token no se pudo generar después de todos los reintentos
    fi

   # 7. Crear token para Prometheus y guardarlo
    echo "Generando token para Prometheus..."
    mkdir -p /vault/data/prometheus
    if vault token create -policy=prometheus -ttl=24h -renewable=true -format=json > /tmp/prom_token.json; then
        jq -r .auth.client_token /tmp/prom_token.json > /vault/data/prometheus/token.txt
        chmod 644 /vault/data/prometheus/token.txt
    else
        echo "❌ Error al crear token para Prometheus"
        exit 1
    fi

    # 8. Configurar autenticación userpass (existente)
    vault auth enable userpass
    vault write auth/userpass/users/transcendence-admin \
        password="$(openssl rand -base64 12)" \
        policies="transcendence"
    
    echo "Configuración completada!"

    # 9. Crear token para ZAP reporter y guardarlo
    echo "Generando token para ZAP Reporter..."
    mkdir -p /vault/data/zap
    if vault token create -policy=zap-reporter -ttl=12h -renewable=true -format=json > /tmp/zap_token.json; then
        jq -r .auth.client_token /tmp/zap_token.json > /vault/data/zap/token.txt
        chmod 644 /vault/data/zap/token.txt
    else
        echo "❌ Error al crear token para ZAP Reporter"
        exit 1
    fi
}

# Inicialización condicional
if [ ! -f "/vault/data/initialized" ]; then
    init_vault
else
    echo "Vault ya está inicializado, procediendo a desbloquear..."
    vault operator unseal $(cat /vault/data/unseal_key.txt)
    export VAULT_TOKEN=$(cat /vault/data/root_token.txt)
fi

# =============================================
# CONFIGURACIÓN DE ZAP
# =============================================

echo "Iniciando ZAP..."
/zap/zap.sh -daemon -host 0.0.0.0 -port 8081 \
  -config api.key=${ZAP_API_KEY:-my_zap_api_key} \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true &

# Esperar que ZAP esté listo
while ! curl -sSf http://localhost:8081/JSON/core/view/version >/dev/null 2>&1; do
  sleep 2
done

# =============================================
# MANTENER CONTENEDOR EN EJECUCIÓN
# =============================================

echo "Todos los servicios están listos"
echo "================================="
echo "URL Vault UI: https://localhost:8200"
echo "Token UI: $(cat /vault/data/ui_token.txt)"
echo "Usuario admin: transcendence-admin"
echo "Contraseña admin: $(vault read -field=password auth/userpass/users/transcendence-admin)"
echo "================================="

# =============================================
# CONFIGURACIÓN DE ENLACES PARA REPORTES
# =============================================

echo "Configurando acceso a reportes..."
mkdir -p /var/www/html/zap_reports
ln -sf /zap/reports/zap_report.html /var/www/html/zap_reports/zap_report.html
ln -sf /zap/reports/security_report.html /var/www/html/zap_reports/security_report.html
chown -R www-data:www-data /var/www/html/zap_reports
chmod -R 755 /var/www/html/zap_reports

tail -f /dev/null