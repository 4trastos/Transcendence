#!/bin/sh
set -e

# Configurar SSL para Grafana
if [ ! -f "/etc/grafana/ssl/grafana.crt" ]; then
  echo "Generando certificados SSL para Grafana..."
  mkdir -p /etc/grafana/ssl
  openssl req -x509 -nodes -days 3650 -newkey rsa:4096 \
    -keyout /etc/grafana/ssl/grafana.key \
    -out /etc/grafana/ssl/grafana.crt \
    -subj "/CN=grafana"
  chmod 440 /etc/grafana/ssl/*
fi

# Esperar a que Prometheus esté listo (con timeout)
echo "Esperando a Prometheus..."
timeout 60s sh -c 'until curl -s http://prometheus:9090/-/healthy >/dev/null; do sleep 2; done'

exec /run.sh