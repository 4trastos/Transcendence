#!/bin/sh
set -e

LOGSTASH_PASSWORD_FILE="/usr/share/elasticsearch/secrets/logstash_internal_password"

# Espera a que exista el archivo
until [ -f "$LOGSTASH_PASSWORD_FILE" ]; do
  sleep 5
done

# Reemplaza en logstash.conf
sed -i "s/password => \".*\"/password => \"$(cat $LOGSTASH_PASSWORD_FILE)\"/" /usr/share/logstash/pipeline/logstash.conf

# Esperar Elasticsearch con credenciales
echo "⏳ Esperando a Elasticsearch..."
until [ -f /usr/share/elasticsearch/secrets/elastic_password ] && \
  curl -s -k -u "elastic:$(cat /usr/share/elasticsearch/secrets/elastic_password)" \
  https://elasticsearch:9200 >/dev/null; do
  sleep 5
done

# Configuración de usuario Logstash
if ! curl -s -k -u "elastic:$(cat /usr/share/elasticsearch/secrets/elastic_password)" \
  "https://elasticsearch:9200/_security/user/logstash_writer" | grep -q '"found":true'; then
  
  echo "🔐 Configurando usuario para Logstash..."
  curl -k -u "elastic:$(cat /usr/share/elasticsearch/secrets/elastic_password)" -X POST \
    "https://elasticsearch:9200/_security/user/logstash_writer" -H "Content-Type: application/json" -d'
    {
      "password": "logstash-internal-pwd",
      "roles": ["logstash_writer"],
      "full_name": "Logstash Writer User"
    }'
fi

exec /usr/share/logstash/bin/logstash "$@"