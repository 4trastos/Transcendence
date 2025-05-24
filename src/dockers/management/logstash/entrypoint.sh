#!/bin/sh
set -e

<<<<<<< HEAD
# Variables esenciales
LOGSTASH_PASSWORD_FILE="/usr/share/elasticsearch/secrets/logstash_internal_password"
ELASTIC_PASSWORD_FILE="/usr/share/elasticsearch/secrets/elastic_password"
MAX_WAIT=300
WAIT_INTERVAL=5

# Función de espera optimizada
wait_for_resource() {
    local resource=$1
    local description=$2
    local current_wait=0
    
    echo "⏳ Esperando $description..."
    until [ -f "$resource" ] || [ $current_wait -ge $MAX_WAIT ]; do
        sleep $WAIT_INTERVAL
        current_wait=$((current_wait + WAIT_INTERVAL))
    done
    
    [ $current_wait -ge $MAX_WAIT ] && { echo "❌ Timeout esperando $description"; exit 1; }
}

# Esperar recursos necesarios
wait_for_resource "$ELASTIC_PASSWORD_FILE" "contraseña de Elasticsearch"
wait_for_resource "$LOGSTASH_PASSWORD_FILE" "contraseña de Logstash"

# Configurar usuario logstash_writer (con reintentos)
LOGSTASH_PASSWORD=$(cat "$LOGSTASH_PASSWORD_FILE")
ELASTIC_PASSWORD=$(cat "$ELASTIC_PASSWORD_FILE")

echo "🔐 Configurando usuario para Logstash..."
for i in {1..5}; do
    if curl -s -k -u "elastic:$ELASTIC_PASSWORD" -X POST \
       "https://elasticsearch:9200/_security/user/logstash_writer" \
       -H "Content-Type: application/json" \
       -d '{"password": "'"$LOGSTASH_PASSWORD"'", "roles": ["logstash_writer"]}' >/dev/null; then
        break
    fi
    sleep 10
    [ $i -eq 5 ] && echo "⚠️ No se pudo configurar usuario logstash_writer"
done

# Actualizar contraseña en configuración
sed -i "s/password => \".*\"/password => \"$LOGSTASH_PASSWORD\"/" /usr/share/logstash/pipeline/logstash.conf

# Iniciar Logstash optimizado
exec /usr/share/logstash/bin/logstash \
    --path.settings /usr/share/logstash/config \
    --path.data /usr/share/logstash/data \
    --path.logs /usr/share/logstash/logs \
    "$@"
=======
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
>>>>>>> integration
