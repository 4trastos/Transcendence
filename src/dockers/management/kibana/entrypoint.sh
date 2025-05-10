#!/bin/bash
set -eo pipefail

TOKEN_FILE="/usr/share/elasticsearch/secrets/kibana_token"
ELASTIC_PASSWORD_FILE="/usr/share/elasticsearch/secrets/elastic_password"

echo "🔎 Buscando token en $TOKEN_FILE..."

# Espera con timeout (300 segundos)
for i in $(seq 1 30); do
  if [ -f "$TOKEN_FILE" ] && [ -s "$TOKEN_FILE" ]; then
    TOKEN=$(cat "$TOKEN_FILE")
    ELASTIC_PASSWORD=$(cat "$ELASTIC_PASSWORD_FILE")
    echo "🔑 Token encontrado (${TOKEN:0:10}...)"
    break
  else
    echo "⏳ Intento $i/30 - Token no disponible..."
    sleep 10
  fi
done

if [ -z "$TOKEN" ]; then
  echo "❌ Error: Token no encontrado después de 5 minutos"
  exit 1
fi

# Configuración dinámica
#{
#  echo ""
#  echo "# Configuración dinámica añadida por entrypoint"
#  echo "elasticsearch.serviceAccountToken: \"$TOKEN\""
#  echo "monitoring.ui.container.elasticsearch.enabled: true"
#  echo "migrations.skip: false"
#  echo "migrations.batchSize: 1000"
#  echo "migrations.pollInterval: 5000"
#} >> /usr/share/kibana/config/kibana.yml

 Configuración dinámica
if ! grep -q '^elasticsearch.serviceAccountToken:' /usr/share/kibana/config/kibana.yml; then
  {
    echo ""
    echo "# Configuración dinámica añadida por entrypoint"
    echo "elasticsearch.serviceAccountToken: \"$TOKEN\""
    echo "monitoring.ui.container.elasticsearch.enabled: true"
    echo "migrations.skip: false"
    echo "migrations.batchSize: 1000"
    echo "migrations.pollInterval: 5000"
  } >> /usr/share/kibana/config/kibana.yml
fi

# Verificar certificados
echo "🔍 Verificando certificados..."
if [ ! -f "/usr/share/elasticsearch/config/certs/ca/ca.crt" ]; then
  echo "❌ Certificado CA no encontrado"
  exit 1
fi

# Configuración adicional para Kibana
echo "⚙️ Configurando índices de Kibana..."
curl -sS -k -X PUT "https://elasticsearch:9200/_cluster/settings" \
  -H "Content-Type: application/json" \
  -u "elastic:$ELASTIC_PASSWORD" \
  -d '{"persistent":{"cluster.routing.allocation.disk.threshold_enabled":false}}'

# Crear índices .kibana necesarios si no existen
echo "⚙️ Preparando índices de Kibana..."
for index in ".kibana" ".kibana_task_manager" ".kibana_alerting_cases"; do
  if ! curl -k -s -u "elastic:$ELASTIC_PASSWORD" "https://elasticsearch:9200/_cat/indices/$index" | grep -q "$index"; then
    echo "🛠 Creando índice $index..."
    curl -k -X PUT "https://elasticsearch:9200/$index" \
      -H "Content-Type: application/json" \
      -u "elastic:$ELASTIC_PASSWORD" \
      -d '{
        "settings": {
          "index.number_of_shards": 1,
          "index.number_of_replicas": 0
        }
      }'
  fi
done

# Verificar conexión con Elasticsearch
echo "🔍 Verificando Elasticsearch..."
until curl -sSf -k -u "elastic:$ELASTIC_PASSWORD" "https://elasticsearch:9200/_cluster/health?wait_for_status=yellow&timeout=50s" >/dev/null; do
  echo "⌛ Elasticsearch no responde, reintentando..."
  sleep 15
done

grep -q '^elasticsearch.serviceAccountToken:' /usr/share/kibana/config/kibana.yml || \
echo "elasticsearch.serviceAccountToken: \"$TOKEN\"" >> /usr/share/kibana/config/kibana.yml

# Iniciar Kibana
echo "Iniciando Kibana..."
exec /usr/share/kibana/bin/kibana &
KPID=$!

# Esperar a que Kibana esté listo
echo "⏳ Esperando a que Kibana esté listo..."
MAX_WAIT=300
WAIT=0
while [ $WAIT -lt $MAX_WAIT ]; do
  if curl -sSf "http://localhost:5601/api/status" >/dev/null; then
    STATUS=$(curl -sS "http://localhost:5601/api/status" | jq -r '.status.overall.state')
    
    case "$STATUS" in
      "green")
        echo "✅ Kibana está listo (status: green)"
        break
        ;;
      "red")
        echo "❌ Kibana tiene errores críticos (status: red)"
        echo "📄 Últimos logs:"
        tail -n 50 /usr/share/kibana/logs/*.log || echo "No se encontraron logs"
        exit 1
        ;;
      *)
        echo "⚠️ Kibana en estado: $STATUS..."
        ;;
    esac
  else
    echo "⌛ Kibana no responde aún..."
  fi
  
  sleep 10
  WAIT=$((WAIT+10))
done

if [ $WAIT -ge $MAX_WAIT ]; then
  echo "❌ Timeout esperando a Kibana después de 5 minutos"
  echo "📄 Logs completos:"
  cat /usr/share/kibana/logs/kibana.log
  exit 1
fi

# Intentar importar dashboards
echo "✅ Kibana está listo, intentando importar dashboards..."
MAX_RETRIES=5
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
  if curl -s -X POST "http://localhost:5601/api/saved_objects/_import?overwrite=true" \
    -H "kbn-xsrf: true" \
    --form file=@/usr/share/kibana/dashboards/kibana_dashboards.json; then
    echo "Dashboards importados exitosamente"
    break
  else
    echo "⚠️ Intento $((RETRY+1)) fallido, reintentando..."
    sleep 20
    RETRY=$((RETRY+1))
  fi
done

wait $KPID