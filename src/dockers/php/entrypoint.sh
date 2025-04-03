#!/bin/bash
set -e

# 1. Configuración de directorios y permisos
mkdir -p \
    /var/run/supervisor \
    /var/log/supervisor \
    /var/run/php \
    /etc/nginx/ssl \
    /zap/reports \
    /var/log/nginx \
    /var/log/modsec \
    /var/cache/modsecurity \
    /tmp/modsecurity

chown -R www-data:www-data \
    /var/run \
    /var/log \
    /etc/nginx \
    /zap/reports \
    /var/cache/modsecurity \
    /tmp/modsecurity

chmod -R 775 \
    /var/run/supervisor \
    /var/log \
    /var/run/php \
    /etc/nginx/ssl \
    /var/cache/modsecurity \
    /tmp/modsecurity

# Crear directorios de logs persistentes
mkdir -p /var/log/nginx /var/log/supervisor /var/log/modsec
chown -R www-data:www-data /var/log
chmod -R 775 /var/log

# Crear archivos de log principales
touch /var/log/nginx/{access,error}.log
touch /var/log/supervisor/supervisord.log
touch /var/log/modsec/modsec_audit.log

# Crear directorios de logs si no existen
mkdir -p /var/log/nginx
touch /var/log/nginx/{access,error}.log
chown -R www-data:www-data /var/log/nginx
chmod -R 775 /var/log/nginx

# Asegurar permisos
chown www-data:www-data /var/log/nginx/*.log
chmod 664 /var/log/nginx/*.log

# 2. Generación de certificados SSL (igual que antes)
SSL_DIR="/etc/nginx/ssl"
if [ ! -f "${SSL_DIR}/server.crt" ] || ! openssl x509 -checkend 86400 -noout -in "${SSL_DIR}/server.crt"; then
    echo "Generando nuevos certificados SSL..."
    find "${SSL_DIR}" -type f -not -name ".keep" -delete
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "${SSL_DIR}/server.key" \
        -out "${SSL_DIR}/server.crt" \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
    cp "${SSL_DIR}/server.crt" "${SSL_DIR}/ca.crt"
    chown www-data:www-data "${SSL_DIR}"/*
    chmod 640 "${SSL_DIR}/server.key"
    chmod 644 "${SSL_DIR}/server.crt" "${SSL_DIR}/ca.crt"
    echo "Certificados SSL generados correctamente."
fi

# 3. Verificación de Nginx
echo "Listando archivo de certificado antes de nginx -t:"
ls -l /etc/nginx/ssl/server.crt
stat /etc/nginx/ssl/server.crt
echo "Listando directorio SSL antes de nginx -t:"
ls -ld /etc/nginx/ssl/
echo "Verificando configuración de Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Configuración de Nginx OK."
else
    echo "Error en la configuración de Nginx. Revisar logs."
    exit 1
fi

# 4. Listar archivos SSL para verificar
echo "Listado de archivos SSL en /etc/nginx/ssl:"
ls -l /etc/nginx/ssl/

# 5. Iniciar Supervisord
echo "Iniciando Supervisord..."
exec supervisord -c /etc/supervisor/supervisord.conf -n -e debug

# 4. Iniciar Supervisord
echo "Iniciando Supervisord..."
exec supervisord -c /etc/supervisor/supervisord.conf -n -e debug