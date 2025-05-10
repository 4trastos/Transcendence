#!/bin/bash
set -e

SECRETS_DIR="./src/dockers/management/elasticsearch/secrets"
PASSWORD_FILE="$SECRETS_DIR/elastic_password"
TOKEN_FILE="$SECRETS_DIR/kibana_service_token"

mkdir -p "$SECRETS_DIR"

# 1. Generar contraseña para elastic
if [ ! -f "$PASSWORD_FILE" ]; then
  echo "🔐 Generando contraseña para 'elastic'..."
  openssl rand -base64 20 > "$PASSWORD_FILE"
  chmod 600 "$PASSWORD_FILE"
fi

# 2. Crear contenedor temporal para generar el token
if [ ! -f "$TOKEN_FILE" ]; then
  echo "🔐 Generando service token para Kibana..."

  docker run --rm \
    --network host \
    -v "$(pwd)/$SECRETS_DIR:/usr/share/elasticsearch/secrets" \
    -e "ELASTIC_PASSWORD=$(cat $PASSWORD_FILE)" \
    docker.elastic.co/elasticsearch/elasticsearch:8.12.0 \
    bash -c "
      bin/elasticsearch-users useradd kibana_system -p \$ELASTIC_PASSWORD -r kibana_system || true;
      bin/elasticsearch-service-tokens create kibana kibana-token > /usr/share/elasticsearch/secrets/kibana_service_token
    "

  chmod 600 "$TOKEN_FILE"
fi

echo "✅ Password y token generados en: $SECRETS_DIR"
