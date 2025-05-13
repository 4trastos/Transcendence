#!/bin/sh
set -e

LOGSTASH_PASSWORD_FILE="/usr/share/elasticsearch/secrets/logstash_internal_password"
ELASTIC_PASSWORD_FILE="/usr/share/elasticsearch/secrets/elastic_password"

# Esperar a que Elasticsearch esté listo
echo "⏳ Esperando a Elasticsearch..."
until [ -f "$ELASTIC_PASSWORD_FILE" ] && \
  curl -s -k -u "elastic:$(cat "$ELASTIC_PASSWORD_FILE")" "https://elasticsearch:9200" >/dev/null; do
  sleep 5
done

# Esperar a que exista la contraseña de Logstash
until [ -f "$LOGSTASH_PASSWORD_FILE" ]; do
  sleep 5
done

# Configurar usuario logstash_writer con contraseña del archivo
LOGSTASH_PASSWORD=$(cat "$LOGSTASH_PASSWORD_FILE")
echo "🔐 Configurando usuario para Logstash..."
curl -k -u "elastic:$(cat "$ELASTIC_PASSWORD_FILE")" -X POST \
  "https://elasticsearch:9200/_security/user/logstash_writer" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "'"$LOGSTASH_PASSWORD"'",
    "roles": ["logstash_writer"],
    "full_name": "Logstash Writer User"
  }' || echo "⚠️ Usuario logstash_writer ya existe o no se pudo crear"

# Actualizar contraseña en logstash.conf
sed -i "s/password => \".*\"/password => \"$LOGSTASH_PASSWORD\"/" /usr/share/logstash/pipeline/logstash.conf

exec /usr/share/logstash/bin/logstash "$@"