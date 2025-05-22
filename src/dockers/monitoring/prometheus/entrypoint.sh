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

  # Crear CSR para Prometheus
  openssl req -new -newkey rsa:4096 -nodes \
    -keyout "$TLS_KEY" -out "$CERT_DIR/prometheus.csr" \
    -subj "/CN=prometheus" \
    -addext "subjectAltName = DNS:prometheus,IP:$MY_IP,IP:127.0.0.1"

  # Firmar el certificado
  openssl x509 -req -in "$CERT_DIR/prometheus.csr" \
    -CA "$TLS_CA" -CAkey "$CERT_DIR/ca.key" -CAcreateserial \
    -out "$TLS_CRT" -days 3650 -sha256

  # Ajustar permisos
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
