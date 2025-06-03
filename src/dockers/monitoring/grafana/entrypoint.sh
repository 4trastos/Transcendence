#!/bin/sh
set -e

# Configurar SSL para Grafana
if [ ! -f "/etc/grafana/ssl/grafana.crt" ]; then
  echo "Generando certificados SSL para Grafana..."
  mkdir -p /etc/grafana/ssl
  
  # Generar CA root
  openssl req -x509 -nodes -newkey rsa:4096 -days 3650 \
    -keyout /etc/grafana/ssl/ca.key \
    -out /etc/grafana/ssl/ca.crt \
    -subj "/CN=Grafana CA"
  
  # Generar certificado firmado por CA con SANs
  openssl req -new -newkey rsa:4096 -nodes \
    -keyout /etc/grafana/ssl/grafana.key \
    -out /etc/grafana/ssl/grafana.csr \
    -subj "/CN=grafana.localhost"
  
  openssl x509 -req -days 3650 -in /etc/grafana/ssl/grafana.csr \
    -CA /etc/grafana/ssl/ca.crt -CAkey /etc/grafana/ssl/ca.key -CAcreateserial \
    -out /etc/grafana/ssl/grafana.crt \
    -extfile <(printf "subjectAltName=DNS:localhost,DNS:grafana,DNS:grafana.localhost,IP:127.0.0.1\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth")
  
  chmod 440 /etc/grafana/ssl/*
fi

# Esperar a Prometheus
echo "Esperando a Prometheus..."
until curl -s http://prometheus:9090/-/healthy >/dev/null; do
  sleep 2
done

# Configurar SQLite
if [ -f "/var/lib/grafana/grafana.db" ]; then
  sqlite3 /var/lib/grafana/grafana.db "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;"
fi

exec /run.sh