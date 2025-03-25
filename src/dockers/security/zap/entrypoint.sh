#!/bin/bash

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
export VAULT_ADDR='https://0.0.0.0:8200'
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
# CONFIGURACIÓN DE VAULT
# =============================================

echo "Iniciando Vault..."
vault server -config=/etc/vault/vault.hcl &

# Esperar inicialización
sleep 5

# Inicializar Vault si es la primera vez
if [ ! -f "/vault/data/initialized" ]; then
    vault operator init -key-shares=1 -key-threshold=1 > /tmp/vault-init.txt
    UNSEAL_KEY=$(grep "Unseal Key" /tmp/vault-init.txt | awk '{print $4}')
    ROOT_TOKEN=$(grep "Root Token" /tmp/vault-init.txt | awk '{print $4}')
    
    echo "$UNSEAL_KEY" > /vault/data/unseal_key.txt
    echo "$ROOT_TOKEN" > /vault/data/root_token.txt
    touch /vault/data/initialized
    
    # Desbloquear con la CA configurada
    vault operator unseal --ca-cert=/etc/vault/tls/ca.crt $UNSEAL_KEY
    export VAULT_TOKEN="$ROOT_TOKEN"
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
tail -f /dev/null