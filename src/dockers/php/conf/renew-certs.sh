#!/bin/bash
while true; do
  sleep 6h  # Verificar cada 6 horas
  
  EXPIRY=$(openssl x509 -enddate -noout -in /etc/vault/tls/cert.pem | cut -d= -f2)
  EXPIRY_TS=$(date -d "$EXPIRY" +%s)
  CURRENT_TS=$(date +%s)
  
  if [ $((EXPIRY_TS - CURRENT_TS)) -lt 172800 ]; then  # 48 horas
    echo "Renovando certificados..."
    vault write pki/issue/your-role \
      common_name="yourdomain.com" \
      ttl=8760h
      
    # Reconfigurar permisos
    chown www-data:www-data /etc/vault/tls/{cert.pem,key.pem,ca.crt}
    chmod 640 /etc/vault/tls/key.pem
    chmod 644 /etc/vault/tls/{cert.pem,ca.crt}
    
    # Notificar a Nginx
    nginx -s reload
  fi
done