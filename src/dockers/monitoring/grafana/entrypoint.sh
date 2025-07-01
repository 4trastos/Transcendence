#!/bin/sh
set -e

# Configurar SSL para Grafana
if [ ! -f "/etc/grafana/ssl/grafana.crt" ]; then
  echo "Generando certificados SSL para Grafana..."
  mkdir -p /etc/grafana/ssl
  
  # Generar CA root
  openssl req -x509 -nodes -newkey rsa:4096 -days 3650 \
    -keyout /etc/grafana/ssl/ca.key \
    -out /etc/grafana/ssl/ca.crt \
    -subj "/CN=Grafana CA"
  
  # Generar certificado firmado por CA con SANs
  openssl req -new -newkey rsa:4096 -nodes \
    -keyout /etc/grafana/ssl/grafana.key \
    -out /etc/grafana/ssl/grafana.csr \
    -subj "/CN=grafana.localhost"
  
  openssl x509 -req -days 3650 -in /etc/grafana/ssl/grafana.csr \
    -CA /etc/grafana/ssl/ca.crt -CAkey /etc/grafana/ssl/ca.key -CAcreateserial \
    -out /etc/grafana/ssl/grafana.crt \
    -extfile <(printf "subjectAltName=DNS:localhost,DNS:grafana,DNS:grafana.localhost,IP:127.0.0.1\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth")
  
  chmod 440 /etc/grafana/ssl/*
fi

# Generar contraseña robusta si no existe
ADMIN_PASSWORD_FILE="/var/lib/grafana/admin_password"
if [ ! -f "$ADMIN_PASSWORD_FILE" ]; then
  echo "🔐 Generando contraseña robusta para Grafana..."
  ADMIN_PASSWORD=$(openssl rand -base64 20 | tr -dc 'a-zA-Z0-9!@#$%^&*()_+-=')
  echo "$ADMIN_PASSWORD" > "$ADMIN_PASSWORD_FILE"
  chmod 600 "$ADMIN_PASSWORD_FILE"
  
  # Mostrar contraseña generada
  echo "================================================"
  echo "🔑 CONTRASEÑA DE ADMINISTRADOR GENERADA: $ADMIN_PASSWORD"
  echo "================================================"
else
  ADMIN_PASSWORD=$(cat "$ADMIN_PASSWORD_FILE")
fi

# Configurar Grafana con la contraseña generada
export GF_SECURITY_ADMIN_PASSWORD="$ADMIN_PASSWORD"

# Esperar a Prometheus
echo "Esperando a Prometheus..."
until curl -s http://prometheus:9090/-/healthy >/dev/null; do
  sleep 2
done

# Configurar SQLite
if [ -f "/var/lib/grafana/grafana.db" ]; then
  sqlite3 /var/lib/grafana/grafana.db "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;"
fi

exec /run.sh