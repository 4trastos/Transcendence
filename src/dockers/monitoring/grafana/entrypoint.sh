#!/bin/sh
set -e

# Esperar a que Prometheus esté listo
until curl -s http://prometheus:9090/-/ready; do
  echo "Esperando a que Prometheus esté listo..."
  sleep 1
done

# Configuración dinámica
sed -i "s|__ELASTIC_PASSWORD__|$(</usr/share/elasticsearch/secrets/elastic_password)|g" \
  /etc/grafana/provisioning/datasources/datasources.yaml

# Iniciar Grafana
exec /run.sh