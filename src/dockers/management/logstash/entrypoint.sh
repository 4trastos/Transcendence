#!/bin/sh
set -e

# Validar que Elasticsearch esté disponible
until curl -s http://elasticsearch:9200; do
  echo "Esperando a Elasticsearch..."
  sleep 5
done

# Ejecutar Logstash
exec /usr/share/logstash/bin/logstash "$@"