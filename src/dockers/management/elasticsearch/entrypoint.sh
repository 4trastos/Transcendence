#!/bin/sh
set -e

echo "🚀 [START] Inicializando Elasticsearch..."

PASSWORD_FILE="/usr/share/elasticsearch/secrets/elastic_password"
CA_CERT_DIR="/usr/share/elasticsearch/config/certs"
KIBANA_TOKEN_PATH="/usr/share/elasticsearch/secrets/kibana_token"
LOGSTASH_PASSWORD_FILE="/usr/share/elasticsearch/secrets/logstash_internal_password"

MY_IP=$(hostname -i | awk '{print $1}')

# Configurar permisos
mkdir -p $(dirname "$PASSWORD_FILE")
mkdir -p $(dirname "$KIBANA_TOKEN_PATH")
mkdir -p "$CA_CERT_DIR"
chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/secrets
chmod 750 /usr/share/elasticsearch/secrets

chmod 755 /usr/share/elasticsearch/config
chmod 755 /usr/share/elasticsearch/config/certs

### 1. Generar certificados TLS primero (versión mejorada)
if [ ! -f "$CA_CERT_DIR/ca/ca.crt" ]; then
  echo "🔒 Generando certificados TLS..."

  # Crear CA
  echo "📦 Generando CA..."
  bin/elasticsearch-certutil ca --silent --pem --days 3650 -out "$CA_CERT_DIR/ca.zip"
  unzip -o "$CA_CERT_DIR/ca.zip" -d "$CA_CERT_DIR"

  # Crear certificados
  echo "📦 Generando certificados..."
  cat > "$CA_CERT_DIR/instances.yml" <<EOF
instances:
  - name: elasticsearch
    dns: 
      - "elasticsearch"
      - "localhost"
    ip:
      - "127.0.0.1"
      - "$MY_IP"
EOF

  bin/elasticsearch-certutil cert --silent --pem --days 3650 \
    --in "$CA_CERT_DIR/instances.yml" \
    --out "$CA_CERT_DIR/certs.zip" \
    --ca-cert "$CA_CERT_DIR/ca/ca.crt" \
    --ca-key "$CA_CERT_DIR/ca/ca.key"
  
  unzip -o "$CA_CERT_DIR/certs.zip" -d "$CA_CERT_DIR"

  # Asegurar permisos
  chmod -R 750 "$CA_CERT_DIR"
  chown -R elasticsearch:elasticsearch "$CA_CERT_DIR"
fi

### 2. Generar contraseña si no existe
if [ ! -f "$PASSWORD_FILE" ]; then
  echo "🔑 Generando contraseña inicial..."
  ELASTIC_PASSWORD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 16)
  echo "$ELASTIC_PASSWORD" > "$PASSWORD_FILE"
  chmod 600 "$PASSWORD_FILE"
fi

### 3. Configuración dinámica (versión simplificada)
echo "🛡 Preparando configuración dinámica..."
{
  echo "cluster.name: \"transcendence-cluster\""
  echo "network.host: 0.0.0.0"
  echo "discovery.type: single-node"
  echo "xpack.security.enabled: true"
  echo "xpack.security.authc.api_key.enabled: true"
  echo "xpack.security.authc.token.timeout: 60s"
  
  # Configuración SSL mejorada
  echo "xpack.security.transport.ssl.enabled: true"
  echo "xpack.security.transport.ssl.verification_mode: certificate"
  echo "xpack.security.transport.ssl.key: $CA_CERT_DIR/elasticsearch/elasticsearch.key"
  echo "xpack.security.transport.ssl.certificate: $CA_CERT_DIR/elasticsearch/elasticsearch.crt"
  echo "xpack.security.transport.ssl.certificate_authorities: [ \"$CA_CERT_DIR/ca/ca.crt\" ]"
  
  echo "xpack.security.http.ssl.enabled: true"
  echo "xpack.security.http.ssl.key: $CA_CERT_DIR/elasticsearch/elasticsearch.key"
  echo "xpack.security.http.ssl.certificate: $CA_CERT_DIR/elasticsearch/elasticsearch.crt"
  echo "xpack.security.http.ssl.certificate_authorities: [ \"$CA_CERT_DIR/ca/ca.crt\" ]"
  
  # Optimizaciones de rendimiento
  echo "cluster.routing.allocation.disk.threshold_enabled: false"
  echo "cluster.routing.allocation.node_initial_primaries_recoveries: 10"
  echo "cluster.routing.allocation.node_concurrent_recoveries: 5"
  echo "indices.recovery.max_bytes_per_sec: \"100mb\""
} > /usr/share/elasticsearch/config/elasticsearch.yml

echo "🔐 Configurando truststore Java..."
# Importar CA al truststore de Java
keytool -importcert -noprompt \
  -keystore /usr/share/elasticsearch/config/certs/truststore.jks \
  -storepass changeit \
  -file "$CA_CERT_DIR/ca/ca.crt" \
  -alias elasticsearch-ca

# Configurar variable de entorno para Java
export ES_JAVA_OPTS="$ES_JAVA_OPTS -Djavax.net.ssl.trustStore=/usr/share/elasticsearch/config/certs/truststore.jks -Djavax.net.ssl.trustStorePassword=changeit"

### 3. Iniciar Elasticsearch con configuración segura
echo "🌀 Iniciando Elasticsearch con seguridad..."
export ELASTIC_PASSWORD=$(cat "$PASSWORD_FILE")
exec /usr/local/bin/docker-entrypoint.sh &
ES_PID=$!

### 4. Esperar Elasticsearch esté completamente disponible
echo "⏳ Esperando a que Elasticsearch esté disponible..."
for i in $(seq 1 60); do  # Aumentado a 60 intentos
  if curl -s -k -u "elastic:$(cat $PASSWORD_FILE)" https://localhost:9200/_cluster/health | grep -q '"status":"green"' || grep -q '"status":"yellow"'; then
    echo "✅ Elasticsearch está disponible"
    break
  else
    echo "🔄 Intento $i/60 - Esperando..."
    sleep 5
  fi
done

### 5. Verificar credenciales
echo "🔐 Verificando credenciales..."
RESPONSE=$(curl -k -s -u "elastic:$(cat $PASSWORD_FILE)" https://localhost:9200/_security/_authenticate)
echo "Respuesta de autenticación: $RESPONSE"
if echo "$RESPONSE" | grep -q '"username":"elastic"'; then
  echo "✅ Autenticación correcta"
else
  echo "⚠️ Autenticación fallida"
  # Aquí debería restablecer la contraseña si es necesario
  NEW_PASSWORD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 16)
  if bin/elasticsearch-reset-password --batch --user elastic --url "https://localhost:9200" --batch "$NEW_PASSWORD"; then
    echo "$NEW_PASSWORD" > "$PASSWORD_FILE"
    chmod 600 "$PASSWORD_FILE"
    echo "✅ Nueva contraseña generada"
  else
    echo "❌ Error al resetear contraseña"
    exit 1
  fi
fi

ELASTIC_PASSWORD=$(cat "$PASSWORD_FILE")
TIMEOUT=300
WAIT_INTERVAL=10 

### 6. Esperar que el índice .security esté activo
wait_for_cluster_health() {
  local start_time=$(date +%s)
  
  while true; do
    # Verificar si Elasticsearch responde
    if ! curl -s -k -u "elastic:$ELASTIC_PASSWORD" https://localhost:9200 >/dev/null; then
      echo "Elasticsearch no responde, esperando..."
      sleep $WAIT_INTERVAL
      continue
    fi

    # Obtener el estado del clúster
    local cluster_health=$(curl -s -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_cluster/health")
    local status=$(echo "$cluster_health" | grep -o '"status":"[^"]*"' | cut -d':' -f2 | tr -d '"')

    # Verificar que el estado sea 'yellow' o 'green'
    if [ "$status" == "green" ] || [ "$status" == "yellow" ]; then
      echo "✅ Elasticsearch está listo (estado: $status)"
      return 0
    fi

    # Timeout
    local current_time=$(date +%s)
    if (( current_time - start_time > TIMEOUT )); then
      echo "❌ Timeout: Elasticsearch no alcanzó el estado 'green' o 'yellow' en $TIMEOUT segundos"
      return 1
    fi

    echo "⏳ Estado actual: $status, esperando..."
    sleep $WAIT_INTERVAL
  done
}

# Esperar hasta que Elasticsearch esté listo
wait_for_cluster_health || exit 1

# Ajustar réplicas con manejo de errores mejorado
echo "⚙️ Ajustando número de réplicas para índices de seguridad..."
INDICES_RESPONSE=$(curl -s -k -u "elastic:$ELASTIC_PASSWORD" "https://localhost:9200/_cat/indices/.security*?h=index")
if [ -z "$INDICES_RESPONSE" ]; then
  echo "⚠️ No se encontraron índices de seguridad, omitiendo ajuste de réplicas"
else
  for INDEX in $INDICES_RESPONSE; do
    echo "🔧 Ajustando réplicas para $INDEX"
    curl -k -u "elastic:$ELASTIC_PASSWORD" -X PUT "https://localhost:9200/$INDEX/_settings" \
      -H "Content-Type: application/json" \
      -d '{"index": {"number_of_replicas": 0}}'
  done
fi

### 7. Generar token de kibana
echo "🔑 Generando token de servicio para Kibana..."
RESPONSE=$(curl -k -s -u "elastic:$ELASTIC_PASSWORD" \
  -X POST "https://localhost:9200/_security/service/elastic/kibana/credential/token" \
  -H "Content-Type: application/json" \
  -w '\n%{http_code}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  TOKEN=$(echo "$BODY" | grep -o '"token":{"name":"[^"]*","value":"[^"]*"}' | sed -E 's/.*"value":"([^"]*)".*/\1/')
  echo "Token generado: ${TOKEN:0:10}..."  # Log para depuración
  
  # Verificar directorio
  mkdir -p $(dirname "$KIBANA_TOKEN_PATH")
  echo "Directorio secrets existe? $(ls -ld $(dirname "$KIBANA_TOKEN_PATH"))"
  
  # Escribir token
  echo "$TOKEN" > "$KIBANA_TOKEN_PATH"
  chmod 600 "$KIBANA_TOKEN_PATH"
  
  # Verificar que se escribió
  if [ -f "$KIBANA_TOKEN_PATH" ]; then
    echo "✅ Token escrito correctamente en $KIBANA_TOKEN_PATH"
    echo "Contenido: $(head -c 10 "$KIBANA_TOKEN_PATH")..."
  else
    echo "❌ Error: No se pudo escribir el token en $KIBANA_TOKEN_PATH"
    exit 1
  fi
else
  echo "❌ Error al crear token. Código HTTP: $HTTP_CODE"
  echo "Respuesta: $BODY"
  exit 1
fi

### 8. logstash_writer
if [ ! -f "$LOGSTASH_PASSWORD_FILE" ]; then
  LOGSTASH_PWD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 16)
  echo "$LOGSTASH_PWD" > "$LOGSTASH_PASSWORD_FILE"
  chmod 640 "$LOGSTASH_PASSWORD_FILE"
fi

LOGSTASH_PWD=$(cat "$LOGSTASH_PASSWORD_FILE")

### 9. Crea el rol logstash_writer si no existe (VERSIÓN CORREGIDA)
if ! curl -s -k -u "elastic:${ELASTIC_PASSWORD}" "https://localhost:9200/_security/role/logstash_writer" | grep -q '"found":true'; then
  echo "🔐 Creando rol logstash_writer..."
  curl -k -X PUT "https://localhost:9200/_security/role/logstash_writer" \
    -H "Content-Type: application/json" \
    -u "elastic:${ELASTIC_PASSWORD}" \
    -d '{
      "cluster": ["monitor", "manage_index_templates", "manage_ilm"],
      "indices": [
        {
          "names": ["transcendence-*", "logs-*"],
          "privileges": ["create_index", "write", "create", "delete_index", "manage", "manage_ilm"]
        }
      ]
    }'
fi

### 10. Crea el usuaio
if ! curl -s -k -u "elastic:${ELASTIC_PASSWORD}" "https://localhost:9200/_security/user/logstash_writer" | grep -q '"found":true'; then
  echo "🔐 Creando usuario logstash_writer..."
  curl -k -X POST "https://localhost:9200/_security/user/logstash_writer" \
    -H "Content-Type: application/json" \
    -u "elastic:${ELASTIC_PASSWORD}" \
    -d '{
      "password": "'"$LOGSTASH_PWD"'",
      "roles": ["logstash_writer"],
      "full_name": "Logstash Writer User"
    }'
fi

# Asegurar que Prometheus pueda leer los certificados
if [ -f "$CA_CERT_DIR/ca/ca.crt" ]; then
  echo "🔐 Configurando permisos para Prometheus..."
  # Crear enlace simbólico correctamente
  ln -sf "$CA_CERT_DIR/ca/ca.crt" "$CA_CERT_DIR/ca.crt"
  # Ajustar permisos
  chmod 644 "$CA_CERT_DIR/ca/ca.crt" "$CA_CERT_DIR/ca.crt"
  chown -R 1000:1000 "$CA_CERT_DIR"  # Usuario de Prometheus
  echo "✅ Certificados configurados para Prometheus"
else
  echo "❌ Error: No se encontró el certificado CA en $CA_CERT_DIR/ca/ca.crt"
  ls -la "$CA_CERT_DIR/ca/" || true
fi

# Crear enlace simbólico esperado por Prometheus
if [ ! -f "$CA_CERT_DIR/ca.crt" ]; then
  ln -s "$CA_CERT_DIR/ca/ca.crt" "$CA_CERT_DIR/ca.crt"
fi


echo "✅ Elasticsearch completamente inicializado"
wait $ES_PID