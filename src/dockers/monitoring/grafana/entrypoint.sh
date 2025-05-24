#!/bin/sh
set -e

<<<<<<< HEAD
# Generar certificados si no existen
if [ ! -f "/etc/grafana/ssl/grafana.crt" ] || [ ! -f "/etc/grafana/ssl/grafana.key" ]; then
  echo "Generando certificados SSL autofirmados..."
  mkdir -p /etc/grafana/ssl
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/grafana/ssl/grafana.key \
    -out /etc/grafana/ssl/grafana.crt \
    -subj "/C=ES/ST=Madrid/L=Madrid/O=YourCompany/CN=grafana"
  chmod 600 /etc/grafana/ssl/*
  chown -R 472:472 /etc/grafana/ssl
fi

# Esperar a Prometheus (opcional)
until curl -k -s https://prometheus:9090/-/ready; do
=======
# Esperar a que Prometheus esté listo
until curl -s http://prometheus:9090/-/ready; do
>>>>>>> integration
  echo "Esperando a que Prometheus esté listo..."
  sleep 1
done

<<<<<<< HEAD
# Iniciar Grafana con HTTPS
=======
# Iniciar Grafana
>>>>>>> integration
exec /run.sh