#!/bin/sh
set -e

echo "🚀 [START] Inicializando Elasticsearch..."

PASSWORD_FILE="/usr/share/elasticsearch/secrets/elastic_password"
CA_CERT_DIR="/usr/share/elasticsearch/config/certs"
KIBANA_TOKEN_PATH="/usr/share/elasticsearch/secrets/kibana_token"

mkdir -p $(dirname "$PASSWORD_FILE")
mkdir -p "$CA_CERT_DIR"

### 1. Generar certificados TLS
if [ ! -f "$CA_CERT_DIR/ca.zip" ]; then
  echo "🔒 Generando certificados TLS..."

  if [ ! -f "$CA_CERT_DIR/instances.yml" ]; then
    cat > "$CA_CERT_DIR/instances.yml" <<EOF
instances:
  - name: "elasticsearch"
    dns:
      - "elasticsearch"
      - "localhost"
    ip:
      - "127.0.0.1"
EOF
  fi

  echo "📦 Generando CA..."
  bin/elasticsearch-certutil ca --silent --pem -out "$CA_CERT_DIR/ca.zip"
  unzip -q "$CA_CERT_DIR/ca.zip" -d "$CA_CERT_DIR"

  echo "📦 Generando certificados..."
  bin/elasticsearch-certutil cert --silent --pem -out "$CA_CERT_DIR/certs.zip" \
    --in "$CA_CERT_DIR/instances.yml" \
    --ca-cert "$CA_CERT_DIR/ca/ca.crt" --ca-key "$CA_CERT_DIR/ca/ca.key"
  unzip -q "$CA_CERT_DIR/certs.zip" -d "$CA_CERT_DIR"

  chmod -R 750 "$CA_CERT_DIR"
fi

### 2. Iniciar Elasticsearch
echo "🌀 Iniciando Elasticsearch..."
/usr/local/bin/docker-entrypoint.sh &
ES_PID=$!

### 3. Esperar a que el puerto TCP 9200 esté disponible
echo "⏳ Esperando a que Elasticsearch abra el puerto 9200..."
until nc -z localhost 9200; do
  echo "🔄 Puerto 9200 aún no disponible..."
  sleep 3
done
echo "✅ Puerto 9200 abierto."

### 4. Crear la contraseña
if [ ! -f "$PASSWORD_FILE" ]; then
  echo "🔐 Generando contraseña de elastic..."
  mkdir -p "$(dirname "$PASSWORD_FILE")"
  chmod 775 "$(dirname "$PASSWORD_FILE")"
  
  # Generar contraseña con verificación de error
  if GENERATED_PASSWORD=$(bin/elasticsearch-reset-password --batch --user elastic 2>&1 | grep 'New value:' | awk '{print $NF}'); then
    echo "$GENERATED_PASSWORD" > "$PASSWORD_FILE"
    sleep 2
    chmod 600 "$PASSWORD_FILE"
    echo "Contraseña guardada en $PASSWORD_FILE"
  else
    echo "❌ Error generando contraseña: $GENERATED_PASSWORD"
    exit 1
  fi
fi

ELASTIC_PASSWORD=$(cat "$PASSWORD_FILE")
echo "🔑 Contraseña de elastic: $ELASTIC_PASSWORD"

### 5. Verificar autenticación
echo "🔐 Verificando autenticación..."
until curl -s -k -u "elastic:$ELASTIC_PASSWORD" https://localhost:9200/_security/_authenticate | grep -q '"username":"elastic"'; do
  echo "🔄 Aún sin autenticación disponible..."
  sleep 5
done
echo "✅ Autenticación correcta."

### 6. Generar token para Kibana
if [ ! -s "$KIBANA_TOKEN_PATH" ]; then
  echo "🔑 Generando token de Kibana..."
  for i in $(seq 1 5); do
    RESPONSE=$(curl -s -k -u "elastic:$ELASTIC_PASSWORD" \
      -X POST "https://localhost:9200/_security/service/elastic/kibana/credential/token/kibana-token" \
      -H "Content-Type: application/json" -d '{"name": "kibana-token"}')

    echo "$RESPONSE" | jq

    if echo "$RESPONSE" | grep -q '"value":'; then
      echo "$RESPONSE" > "$KIBANA_TOKEN_PATH"
      echo "✅ Token de Kibana generado."
      break
    else
      echo "❌ Fallo generando el token, reintentando..."
    fi

    sleep 5
  done
fi

### 7. Permisos finales
chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/data
chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/secrets

echo "✅ Elasticsearch listo y en foreground."
wait $ES_PID
