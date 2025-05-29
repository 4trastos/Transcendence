#!/bin/sh
set -e

echo "🚀 [START] Inicializando Prometheus..."

CERT_DIR="/etc/prometheus/certs"
mkdir -p "${CERT_DIR}" /prometheus/data
chown -R nobody:nogroup "${CERT_DIR}" /prometheus
chmod -R 750 "${CERT_DIR}"
chmod 755 /prometheus/data

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

  chmod 600 "${CERT_DIR}"/*.key
  chmod 644 "${CERT_DIR}"/*.crt
fi

echo "🌀 Iniciando Prometheus..."
exec /usr/local/bin/prometheus \
  --config.file="/etc/prometheus/prometheus.yml" \
  --web.listen-address="0.0.0.0:9090" \
  --web.enable-lifecycle \
  --web.config.file=/etc/prometheus/web-config.yml \
  --storage.tsdb.path=/prometheus/data