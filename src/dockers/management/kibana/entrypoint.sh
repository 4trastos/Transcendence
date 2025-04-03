#!/bin/sh
set -e

# Esperar a que Elasticsearch esté listo
until curl -s http://elasticsearch:9200; do
  echo "Esperando a Elasticsearch..."
  sleep 5
done

# Ejecutar Kibana
exec /usr/share/kibana/bin/kibana "$@"