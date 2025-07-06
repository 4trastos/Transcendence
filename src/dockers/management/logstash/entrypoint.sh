#!/bin/sh
set -e

# Variables esenciales
LOGSTASH_PASSWORD_FILE="/usr/share/elasticsearch/secrets/logstash_internal_password"
ELASTIC_PASSWORD_FILE="/usr/share/elasticsearch/secrets/elastic_password"
MAX_WAIT=300
WAIT_INTERVAL=5

# Función mejorada de espera con verificación de Elasticsearch
wait_for_resource() {
    local resource=$1
    local description=$2
    local current_wait=0
    
    echo "⏳ Esperando $description..."
    until [ -f "$resource" ] || [ $current_wait -ge $MAX_WAIT ]; do
        # Verificar también si Elasticsearch está disponible
        if [ -f "$ELASTIC_PASSWORD_FILE" ] && curl -s -k "https://elasticsearch:9200" -u "elastic:$(cat $ELASTIC_PASSWORD_FILE)" >/dev/null; then
            echo "✅ Elasticsearch está disponible pero $description no existe aún"
        fi
        sleep $WAIT_INTERVAL
        current_wait=$((current_wait + WAIT_INTERVAL))
        echo "🔄 Esperando... ($current_wait/$MAX_WAIT segundos)"
    done
    
    if [ $current_wait -ge $MAX_WAIT ]; then
        echo "❌ Timeout esperando $description"
        echo "Contenido de /usr/share/elasticsearch/secrets:"
        ls -la /usr/share/elasticsearch/secrets || true
        exit 1
    fi
    echo "✅ $description encontrado"
}

# Esperar recursos necesarios
wait_for_resource "$ELASTIC_PASSWORD_FILE" "contraseña de Elasticsearch"
wait_for_resource "$LOGSTASH_PASSWORD_FILE" "contraseña de Logstash"

# Configurar usuario logstash_writer (con reintentos mejorados)
LOGSTASH_PASSWORD=$(cat "$LOGSTASH_PASSWORD_FILE")
ELASTIC_PASSWORD=$(cat "$ELASTIC_PASSWORD_FILE")

echo "🔐 Configurando usuario para Logstash..."
for i in {1..10}; do
    if curl -s -k -u "elastic:$ELASTIC_PASSWORD" -X POST \
       "https://elasticsearch:9200/_security/user/logstash_writer/_password" \
       -H "Content-Type: application/json" \
       -d '{"password": "'"$LOGSTASH_PASSWORD"'"}' >/dev/null; then
        echo "✅ Usuario logstash_writer configurado correctamente"
        break
    else
        echo "⚠️ Intento $i/10 fallido, reintentando en 10 segundos..."
        sleep 10
        [ $i -eq 10 ] && echo "❌ No se pudo configurar usuario logstash_writer después de 10 intentos" && exit 1
    fi
done

# Actualizar contraseña en configuración (si existe el archivo)
if [ -f "/usr/share/logstash/pipeline/logstash.conf" ]; then
    sed -i "s/password => \".*\"/password => \"$LOGSTASH_PASSWORD\"/" /usr/share/logstash/pipeline/logstash.conf
else
    echo "⚠️ No se encontró logstash.conf, omitiendo actualización de contraseña"
fi

# Verificar conexión con Elasticsearch antes de iniciar
echo "🔍 Verificando conexión con Elasticsearch..."
if curl -s -k -u "logstash_writer:$LOGSTASH_PASSWORD" "https://elasticsearch:9200" >/dev/null; then
    echo "✅ Conexión exitosa a Elasticsearch"
else
    echo "❌ No se pudo conectar a Elasticsearch"
    exit 1
fi

# ====================================================================
# NUEVO BLOQUE: Cargar Plantilla de Índice de Elasticsearch
# ====================================================================
TEMPLATE_FILE="/usr/share/logstash/pipeline/elasticsearch-template.json"
TEMPLATE_NAME="transcendence-template" # Puedes poner el nombre que quieras para tu plantilla

echo "⚙️ Intentando cargar la plantilla de índice de Elasticsearch..."
for i in {1..10}; do
    if curl -s -k -u "elastic:$ELASTIC_PASSWORD" -X PUT \
       "https://elasticsearch:9200/_template/$TEMPLATE_NAME" \
       -H "Content-Type: application/json" \
       --data-binary "@$TEMPLATE_FILE" >/dev/null; then
        echo "✅ Plantilla de índice '$TEMPLATE_NAME' cargada correctamente."
        break
    else
        echo "⚠️ Intento $i/10 fallido al cargar la plantilla, reintentando en 10 segundos..."
        sleep 10
        [ $i -eq 10 ] && echo "❌ No se pudo cargar la plantilla de índice después de 10 intentos." && exit 1
    fi
done
# ====================================================================

# Iniciar Logstash optimizado
echo "🚀 Iniciando Logstash..."
exec /usr/share/logstash/bin/logstash \
    --path.settings /usr/share/logstash/config \
    --path.data /usr/share/logstash/data \
    --path.logs /usr/share/logstash/logs \
    "$@"