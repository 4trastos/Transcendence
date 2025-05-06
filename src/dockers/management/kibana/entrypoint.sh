#!/bin/sh
set -e

# Esperar a que el token tenga formato JSON válido
echo "⏳ Esperando token de Kibana..."
while ! grep -q '"value":' /usr/share/elasticsearch/secrets/kibana_token 2>/dev/null; do
  sleep 5
done

# Extraer token usando método robusto
TOKEN=$(grep -o '"token"[^}]*' /usr/share/elasticsearch/secrets/kibana_token | \
        grep -o '"value":"[^"]*"' | \
        cut -d'"' -f4)

echo "⏳ Esperando a Elasticsearch..."
until curl -s -k -H "Authorization: Bearer $TOKEN" https://elasticsearch:9200 >/dev/null; do
  sleep 5
done

echo "🧪 Token leído:"
cat /usr/share/elasticsearch/secrets/kibana_token || echo "❌ Token no disponible aún"

# Configuración adicional para Kibana
echo "Configurando índices de Kibana..."
curl -X PUT "http://elasticsearch:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "cluster.routing.allocation.disk.threshold_enabled": false
  }
}'

# Iniciar Kibana en segundo plano
echo "Iniciando Kibana..."
/usr/share/kibana/bin/kibana &

# Esperar a que Kibana esté listo
echo "Esperando a Kibana..."
until curl -s -X GET http://localhost:5601/api/status | grep -q '"state":"green"'; do
  echo "Kibana aún no está listo..."
  sleep 10
done

# Intentar importar dashboards con reintentos
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
    sleep 15
    RETRY=$((RETRY+1))
  fi
done

wait