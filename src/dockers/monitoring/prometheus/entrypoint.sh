#!/bin/sh
set -e

echo "🚀 [START] Inicializando Prometheus..."

CERT_DIR="/etc/prometheus/certs"
mkdir -p "${CERT_DIR}" /prometheus/data

# Cambiar permisos SOLO si somos root (evitar errores en sistemas sin permisos)
if [ "$(id -u)" -eq 0 ]; then
    chown -R nobody:nogroup "${CERT_DIR}" /prometheus 2>/dev/null || \
        echo "⚠️ No se pudo cambiar ownership - continuando sin cambiar permisos"
    chmod -R 750 "${CERT_DIR}" 2>/dev/null || \
        echo "⚠️ No se pudo cambiar permisos de CERT_DIR - continuando"
    chmod 755 /prometheus/data 2>/dev/null || \
        echo "⚠️ No se pudo cambiar permisos de /prometheus/data - continuando"
fi

# Generar certificados si no existen
if [ ! -f "${CERT_DIR}/prometheus.crt" ]; then
  echo "🔐 Generando CA y certificados TLS..."
  
  # Generar CA
  openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
    -keyout "${CERT_DIR}/ca.key" -out "${CERT_DIR}/ca.crt" \
    -subj "/CN=Prometheus-CA"

  # Generar certificado del servidor
  openssl req -newkey rsa:4096 -nodes \
    -keyout "${CERT_DIR}/prometheus.key" \
    -out "${CERT_DIR}/prometheus.csr" \
    -subj "/CN=prometheus"

  openssl x509 -req -in "${CERT_DIR}/prometheus.csr" \
    -CA "${CERT_DIR}/ca.crt" -CAkey "${CERT_DIR}/ca.key" -CAcreateserial \
    -out "${CERT_DIR}/prometheus.crt" -days 3650 -sha256

  # Cambiar permisos de los certificados (solo si somos root)
  if [ "$(id -u)" -eq 0 ]; then
      chmod 600 "${CERT_DIR}"/*.key 2>/dev/null || \
          echo "⚠️ No se pudo proteger clave privada"
      chmod 644 "${CERT_DIR}"/*.crt 2>/dev/null || \
          echo "⚠️ No se pudo cambiar permisos de certificados"
  fi
fi

# Configuración de autenticación
WEB_CONFIG="/etc/prometheus/web-config.yml"

# Generar contraseña si no existe
PASSWORD_FILE="/prometheus/data/admin_password"
if [ ! -f "$PASSWORD_FILE" ]; then
  echo "🔐 Generando contraseña robusta para Prometheus..."
  # Generar una contraseña que sea segura para shell y Python
  ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16) # Simplificado para evitar caracteres problemáticos
  echo "$ADMIN_PASSWORD" > "$PASSWORD_FILE"
  chmod 600 "$PASSWORD_FILE"
  
  # Generar hash BCrypt usando Python de forma más robusta
  # Se usa printf %s para evitar problemas con saltos de línea y se cita el script Python
  HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw(b'$ADMIN_PASSWORD', bcrypt.gensalt(rounds=10)).decode('utf-8'))")
  
  echo "================================================"
  echo "🔑 USUARIO: Admin"
  echo "🔑 CONTRASEÑA: $ADMIN_PASSWORD"
  echo "🔑 HASH BCrypt: $HASH"
  echo "================================================"
else
  ADMIN_PASSWORD=$(cat "$PASSWORD_FILE")
  # Generar hash BCrypt usando Python de forma más robusta
  HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw(b'$ADMIN_PASSWORD', bcrypt.gensalt(rounds=10)).decode('utf-8'))")
fi

# Crear archivo de configuración web
cat > "$WEB_CONFIG" <<EOF
tls_server_config:
  cert_file: "${CERT_DIR}/prometheus.crt"
  key_file: "${CERT_DIR}/prometheus.key"

basic_auth_users:
  Admin: "$HASH"
EOF

echo "🛡️  Autenticación básica configurada con BCrypt"

echo "🌀 Iniciando Prometheus..."
exec /usr/local/bin/prometheus \
  --config.file="/etc/prometheus/prometheus.yml" \
  --web.listen-address="0.0.0.0:9090" \
  --web.enable-lifecycle \
  --web.config.file=/etc/prometheus/web-config.yml \
  --storage.tsdb.path=/prometheus/data