#!/bin/bash

set -e

# Iniciar Elasticsearch en segundo plano
/usr/local/bin/docker-entrypoint.sh &

# Esperar a que Elasticsearch esté accesible y autenticado
until curl -s -k https://localhost:9200/_security/_authenticate \
    --cacert /usr/share/elasticsearch/config/certs/ca/ca.crt \
    -u elastic:$(cat /usr/share/elasticsearch/secrets/elastic_password) | grep -q username; do
    echo "Esperando a que Elasticsearch esté autenticado..."
    sleep 5
done

echo "Elasticsearch autenticado, generando token para Kibana..."

# Generar token para Kibana
curl -s -k -X POST https://localhost:9200/_security/service/elastic/kibana/_credential/token \
    --cacert /usr/share/elasticsearch/config/certs/ca/ca.crt \
    -u elastic:$(cat /usr/share/elasticsearch/secrets/elastic_password) \
    -o /usr/share/elasticsearch/secrets/kibana_token

echo "Token generado:"
cat /usr/share/elasticsearch/secrets/kibana_token

wait
