#!/bin/sh
set -e

echo "🚀 [START] Inicializando Prometheus..."

CERT_DIR="/etc/prometheus/certs"
TLS_KEY="$CERT_DIR/prometheus.key"
TLS_CRT="$CERT_DIR/prometheus.crt"
TLS_CA="$CERT_DIR/ca.crt"

# Enlace de datos (opcional si ya está montado desde el volumen)
echo "📁 Verificando carpeta /data para query logs de Prometheus..."
mkdir -p /prometheus
ln -sfn /prometheus /data  # crea symlink a volumen de datos

mkdir -p "$CERT_DIR"
chmod 700 "$CERT_DIR"

# Obtener IP del contenedor
MY_IP=$(hostname -i | awk '{print $1}')

### 1. Generar CA y certificados si no existen
if [ ! -f "$TLS_CA" ]; then
  echo "🔐 Generando CA y certificados TLS para Prometheus..."

  # Crear CA (válida por 10 años)
  openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
    -keyout "$CERT_DIR/ca.key" -out "$TLS_CA" \
    -subj "/CN=Prometheus-CA"

  # Crear archivo temporal de configuración para incluir SAN (Subject Alternative Name)
  cat > "$CERT_DIR/openssl.cnf" <<EOF
  [ req ]
  distinguished_name = req_distinguished_name
  req_extensions = v3_req
  prompt = no

  [ req_distinguished_name ]
  CN = prometheus

  [ v3_req ]
  subjectAltName = @alt_names

  [ alt_names ]
  DNS.1 = prometheus
  IP.1 = 127.0.0.1
  IP.2 = $MY_IP
EOF

  # Crear CSR usando SAN correctamente
  openssl req -new -nodes -newkey rsa:4096 \
    -keyout "$TLS_KEY" -out "$CERT_DIR/prometheus.csr" \
    -config "$CERT_DIR/openssl.cnf"

  # Firmar el certificado con la extensión SAN
  openssl x509 -req -in "$CERT_DIR/prometheus.csr" \
    -CA "$TLS_CA" -CAkey "$CERT_DIR/ca.key" -CAcreateserial \
    -out "$TLS_CRT" -days 3650 -sha256 \
    -extensions v3_req -extfile "$CERT_DIR/openssl.cnf"

  # Limpiar y ajustar permisos
  rm "$CERT_DIR/openssl.cnf"
  chmod 600 "$TLS_KEY" "$CERT_DIR/ca.key"
  chmod 644 "$TLS_CRT" "$TLS_CA"
fi


echo "📦 Usando archivo prometheus.yml existente..."

### 2. Iniciar Prometheus con TLS
echo "🌀 Iniciando Prometheus en modo seguro con TLS..."
exec /usr/local/bin/prometheus \
  --config.file="/etc/prometheus/prometheus.yml" \
  --web.listen-address="0.0.0.0:9090" \
  --web.enable-lifecycle \
  --web.config.file=/etc/prometheus/web-config.yml
