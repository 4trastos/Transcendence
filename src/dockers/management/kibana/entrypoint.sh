#!/bin/bash
set -eo pipefail

TOKEN_FILE="/usr/share/elasticsearch/secrets/kibana_token"
ELASTIC_PASSWORD_FILE="/usr/share/elasticsearch/secrets/elastic_password"
CA_CERT="/usr/share/elasticsearch/config/certs/ca/ca.crt"
KIBANA_CONFIG="/usr/share/kibana/config/kibana.yml"

# Función para validar YAML
validate_yaml() {
  local file=$1
  if command -v python3 &> /dev/null; then
    if ! python3 -c "import yaml; yaml.safe_load(open('$file'))" >/dev/null 2>&1; then
      echo "❌ Error de sintaxis YAML:"
      python3 -c "import yaml; yaml.safe_load(open('$file'))"
      return 1
    fi
  else
    # Validación básica sin Python
    if grep -q "[[:space:]]\+:[[:space:]]*" "$file"; then
      echo "❌ Error: Espacios antes de ':' en YAML"
      return 1
    fi
  fi
  return 0
}

# Esperar por Elasticsearch y el token
echo "⏳ Esperando por Elasticsearch y el token..."
MAX_WAIT=300
WAIT=0
while [ $WAIT -lt $MAX_WAIT ]; do
  if [ -f "$ELASTIC_PASSWORD_FILE" ] && \
     [ -f "$TOKEN_FILE" ] && \
     curl -s -k -u "elastic:$(cat $ELASTIC_PASSWORD_FILE)" "https://elasticsearch:9200" >/dev/null; then
    break
  fi
  sleep 5
  WAIT=$((WAIT+5))
done

[ $WAIT -ge $MAX_WAIT ] && { echo "❌ Tiempo de espera agotado"; exit 1; }

# Leer credenciales
TOKEN=$(cat "$TOKEN_FILE")
ELASTIC_PASSWORD=$(cat "$ELASTIC_PASSWORD_FILE")

# Crear nueva configuración temporal
TEMP_CONFIG=$(mktemp)

# Procesar la configuración original
{
  # Mantener todo excepto las secciones que vamos a reemplazar
  grep -v -e "^elasticsearch.username:" \
         -e "^elasticsearch.password:" \
         -e "^elasticsearch.serviceAccountToken:" \
         -e "^elasticsearch.ssl.certificateAuthorities:" \
         -e "^elasticsearch.ssl.verificationMode:" \
         -e "^monitoring.ui.container.elasticsearch.enabled:" \
         -e "^xpack.actions.preconfigured:" \
         -e "^xpack.actions.preconfiguredAlertHistoryEsIndex:" \
         -e "^xpack.alerting.rules.minimumScheduleInterval.value:" \
         "$KIBANA_CONFIG"
  
  # Añadir nueva configuración SSL
  echo ""
  echo "# Configuración SSL"
  echo "elasticsearch.ssl.certificateAuthorities: [\"$CA_CERT\"]"
  echo "elasticsearch.ssl.verificationMode: certificate"
  
  # Añadir token y configuración de monitoreo
  echo ""
  echo "# Configuración de seguridad"
  echo "elasticsearch.serviceAccountToken: \"$TOKEN\""
  echo "monitoring.ui.container.elasticsearch.enabled: true"
  
  # Añadir configuración de alertas (solo una vez)
  echo ""
  echo "# Configuración de alertas"
  echo "xpack.actions.preconfigured: {}"
  echo "xpack.actions.preconfiguredAlertHistoryEsIndex: false"
  echo "xpack.alerting.rules.minimumScheduleInterval.value: \"1m\""
} > "$TEMP_CONFIG"

# Validar YAML
if ! validate_yaml "$TEMP_CONFIG"; then
  echo "🔍 Contenido del archivo problemático:"
  cat "$TEMP_CONFIG"
  rm "$TEMP_CONFIG"
  exit 1
fi

# Reemplazar configuración
mv "$TEMP_CONFIG" "$KIBANA_CONFIG"

#################

# Función para esperar a que Kibana esté listo
wait_for_kibana() {
  echo "⏳ Esperando a que Kibana esté listo..."
  until curl -sSk -u "elastic:$ELASTIC_PASSWORD" "https://localhost:5601/api/status" | grep -q '"state":"green"'; do
    sleep 5
  done
}

# Función para crear el index pattern
create_index_pattern() {
  echo "🔄 Creando index pattern..."
  until curl -sSk -u "elastic:$ELASTIC_PASSWORD" -X POST "https://localhost:5601/api/saved_objects/index-pattern/transcendence-*" \
    -H "kbn-xsrf: true" \
    -H "Content-Type: application/json" \
    -d '{
      "attributes": {
        "title": "transcendence-*",
        "timeFieldName": "@timestamp"
      }
    }'; do
    echo "⚠️ Falló al crear index pattern, reintentando..."
    sleep 5
  done
}

# Función para importar dashboards
import_dashboard() {
  echo "📊 Importando dashboards..."
  until curl -sSk -u "elastic:$ELASTIC_PASSWORD" \
    -X POST "https://localhost:5601/api/saved_objects/_import?overwrite=true" \
    -H "kbn-xsrf: true" \
    --form file=@/usr/share/kibana/dashboards/kibana_dashboards.ndjson; do
    echo "⚠️ Falló al importar dashboards, reintentando..."
    sleep 5
  done
}

#################

# Iniciar Kibana
echo "🚀 Iniciando Kibana..."
exec /usr/share/kibana/bin/kibana
KPID=$!

# Espera mejorada con verificación de estado
echo "⏳ Esperando a Kibana..."
MAX_WAIT=300
WAIT=0
KIBANA_READY=false

while [ $WAIT -lt $MAX_WAIT ]; do
  if STATUS=$(curl -sSk "https://localhost:5601/api/status" | jq -r '.status.overall.state'); then
    case "$STATUS" in
      "green"|"yellow")
        echo "✅ Kibana listo (status: $STATUS)"
        KIBANA_READY=true
        break
        ;;
      "red")
        echo "❌ Kibana con errores (status: red)"
        tail -n 50 /usr/share/kibana/logs/*.log
        exit 1
        ;;
    esac
  fi
  sleep 10
  WAIT=$((WAIT+10))
done

$KIBANA_READY || { echo "❌ Timeout esperando a Kibana"; exit 1; }

# Esperar a que Kibana esté listo
wait_for_kibana

# Crear index pattern e importar dashboards
create_index_pattern
import_dashboard

echo "✅ Configuración completada"

wait $KPID