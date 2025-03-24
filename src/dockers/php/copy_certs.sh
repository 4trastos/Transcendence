#!/bin/bash

# Esperar a que los certificados estén disponibles
while [ ! -f /etc/vault/tls/ca.crt ] || [ ! -f /etc/vault/tls/cert.pem ] || [ ! -f /etc/vault/tls/key.pem ]; do
  echo "Esperando a que los certificados estén disponibles..."
  sleep 5
done

# Copiar los certificados a /etc/nginx/certs/
cp /etc/vault/tls/ca.crt /etc/nginx/certs/ca.crt
cp /etc/vault/tls/cert.pem /etc/nginx/certs/cert.pem
cp /etc/vault/tls/key.pem /etc/nginx/certs/key.pem

# Cambiar los permisos de los certificados
#chmod 644 /etc/nginx/certs/ca.crt /etc/nginx/certs/cert.pem /etc/nginx/certs/key.pem

echo "Certificados copiados correctamente."