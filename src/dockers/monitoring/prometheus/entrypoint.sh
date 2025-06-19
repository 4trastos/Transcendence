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

echo "🌀 Iniciando Prometheus..."
exec /usr/local/bin/prometheus \
  --config.file="/etc/prometheus/prometheus.yml" \
  --web.listen-address="0.0.0.0:9090" \
  --web.enable-lifecycle \
  --web.config.file=/etc/prometheus/web-config.yml \
  --storage.tsdb.path=/prometheus/data