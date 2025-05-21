#!/bin/sh
set -e

# Esperar a que Prometheus esté listo
until curl -s http://prometheus:9090/-/ready; do
  echo "Esperando a que Prometheus esté listo..."
  sleep 1
done

# Iniciar Grafana
exec /run.sh