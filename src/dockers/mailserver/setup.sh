#!/bin/bash

# Configuración mínima para emails transaccionales
echo "Configurando mailserver para verificación y 2FA..."

# 1. Configura Postfix para enviar emails sin autenticación local
postconf -e "mynetworks = 172.16.0.0/12 127.0.0.0/8 [::1]/128 [fe80::]/64"
postconf -e "smtpd_recipient_restrictions = permit_mynetworks, reject_unauth_destination"
postconf -e "smtpd_relay_restrictions = permit_mynetworks, reject_unauth_destination"

# 2. Configura límites para emails transaccionales
postconf -e "message_size_limit = 10MB"
postconf -e "smtpd_error_sleep_time = 1s"

# 3. Inicia servicios mínimos
echo "Iniciando servicios..."
supervisord -c /etc/supervisor/supervisord.conf

# 4. Verificación periódica
while true; do
    if ! supervisorctl status postfix | grep -q RUNNING; then
        echo "Postfix no está corriendo, reiniciando..."
        supervisorctl restart postfix
    fi
    sleep 60
done