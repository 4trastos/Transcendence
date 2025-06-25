#!/bin/bash

# Verificar si es entorno de producción
if [ "$ENVIRONMENT" = "production" ]; then
    export VAULT_TOKEN_TTL="1h"
    export VAULT_SECRET_ID_TTL="24h"
else
    export VAULT_TOKEN_TTL="24h"
    export VAULT_SECRET_ID_TTL="720h"
fi

# =============================================
# CONFIGURACIÓN DE DIRECTORIOS Y CERTIFICADOS
# =============================================

# 1. Crear estructura de directorios
mkdir -p /vault/data /vault/backup /etc/vault/tls /zap/reports /zap/wrk

# 2. Generar CA raíz si no existe (se guarda en tls_volume)
if [ ! -f "/etc/vault/tls/ca.crt" ]; then
  echo "Generando nueva CA raíz..."
  openssl genrsa -out /etc/vault/tls/ca.key 4096
  openssl req -x509 -new -nodes -key /etc/vault/tls/ca.key \
    -sha256 -days 3650 -out /etc/vault/tls/ca.crt \
    -subj "/CN=Transcendence Internal CA"
fi

# 3. Generar certificado del servidor (se guarda en tls_volume)
echo "Generando certificado TLS..."
openssl req -newkey rsa:4096 -nodes \
  -keyout /etc/vault/tls/key.pem \
  -out /etc/vault/tls/cert.csr \
  -subj "/CN=transcendence" \
  -config /app-scripts/openssl.cnf

# 4. Firmar certificado con SANs (se guarda en tls_volume)
openssl x509 -req -in /etc/vault/tls/cert.csr \
  -CA /etc/vault/tls/ca.crt \
  -CAkey /etc/vault/tls/ca.key \
  -CAcreateserial \
  -out /etc/vault/tls/cert.pem \
  -days 365 -sha256 \
  -extfile /app-scripts/openssl.cnf \
  -extensions v3_ca

# Configurar nombre de host para resolución interna
echo "127.0.0.1 security security.transcendence" >> /etc/hosts

# Configurar variables de entorno para curl
echo "export CURL_CA_BUNDLE=/etc/vault/tls/ca.crt" >> /root/.bashrc
echo "export REQUESTS_CA_BUNDLE=/etc/vault/tls/ca.crt" >> /root/.bashrc

# Configurar CA como confiable para el contenedor 'security'
echo "Configurando CA como confiable para este contenedor..."
cp /etc/vault/tls/ca.crt /usr/local/share/ca-certificates/
update-ca-certificates --fresh
chmod 644 /etc/ssl/certs/*.pem

# Exportar variables críticas para Vault
export VAULT_ADDR='https://security:8200'
export VAULT_CACERT='/etc/vault/tls/ca.crt'

# 5. Preparar certificados para otros servicios (Nginx, ZAP)
echo "Preparando certificados compartidos..."
# Los certificados ya están en tls_volume en /etc/vault/tls/.
# Nginx los leerá desde /etc/nginx/ssl/server.crt y /etc/nginx/ssl/server.key
# porque el mismo tls_volume está montado en ambas rutas.
# Renombramos para que Nginx encuentre los nombres de archivo esperados.
cat /etc/vault/tls/cert.pem /etc/vault/tls/ca.crt > /etc/vault/tls/server.crt
cp /etc/vault/tls/key.pem /etc/vault/tls/server.key

# Para ZAP (enlace simbólico) - este enlace se crea en el volumen /zap/wrk
ln -sf /etc/vault/tls /zap/wrk/tls

# 6. Configurar permisos en el volumen TLS
chmod 644 /etc/vault/tls/*.crt /etc/vault/tls/*.pem
chmod 600 /etc/vault/tls/*.key
chmod 755 /etc/vault/tls

# =============================================
# CONFIGURACIÓN COMPLETA DE VAULT
# =============================================

echo "Iniciando Vault..."
vault server -config=/etc/vault/vault.hcl &

# ! --- CAMBIO CLAVE AQUÍ: Esperar a que el servidor de Vault esté escuchando ---
echo "Esperando que el servidor de Vault inicie y escuche en el puerto 8200..."
# Un pequeño sleep para dar tiempo a Vault a empezar a bindear el puerto
sleep 5
# Usamos netcat para verificar si el puerto está abierto, es más fiable que curl para esto.
until nc -z -w 1 localhost 8200; do
    echo "Vault no está escuchando, esperando..."
    sleep 2
done
echo "El servidor de Vault está escuchando."
# ! --------------------------------------------------------------------------

# Función para backup de credenciales (se mantiene aquí, ya que es un paso post-configuración)
backup_vault_credentials() {
    echo "Backup de credenciales críticas..."
    tar czf /vault/backup/vault_credentials_$(date +%Y%m%d).tar.gz \
        /vault/data/unseal_key.txt \
        /vault/data/root_token.txt \
        /vault/data/role_id.txt \
        /vault/data/secret_id.txt # Incluir secret_id
    chmod 600 /vault/backup/*.tar.gz
    echo "Backup de credenciales completado."
}

# Inicialización condicional de Vault
if [ ! -f "/vault/data/initialized" ]; then
    echo "Inicializando Vault por primera vez..."
    # Inicializar y desbloquear Vault
    # Los comandos 'vault operator init' y 'vault operator unseal' esperan que Vault sea accesible.
    vault operator init -key-shares=1 -key-threshold=1 > /tmp/vault-init.txt
    UNSEAL_KEY=$(grep "Unseal Key" /tmp/vault-init.txt | awk '{print $4}')
    ROOT_TOKEN=$(grep "Root Token" /tmp/vault-init.txt | awk '{print $4}')
    
    echo "$UNSEAL_KEY" > /vault/data/unseal_key.txt
    echo "$ROOT_TOKEN" > /vault/data/root_token.txt
    touch /vault/data/initialized # Marca de inicialización
    
    export VAULT_TOKEN="$ROOT_TOKEN" # Exportar token para el resto de configuraciones
    
    vault operator unseal $UNSEAL_KEY
    echo "Vault inicializado y desbloqueado."

    # Habilitar audit logging (solo la primera vez)
    vault audit enable file file_path=/vault/data/audit.log || true 
    echo "Audit logging habilitado."

    # ! --- LLAMADA AL SCRIPT DE CONFIGURACIÓN COMPLETO (configure_vault.sh) ---
    /app-scripts/configure_vault.sh
    # ! ---------------------------------------------------------------------
    
    backup_vault_credentials # Realizar backup después de la primera configuración
else
    echo "Vault ya está inicializado, procediendo a desbloquear y reconfigurar si es necesario..."
    UNSEAL_KEY=$(cat /vault/data/unseal_key.txt)
    ROOT_TOKEN=$(cat /vault/data/root_token.txt)
    
    export VAULT_TOKEN="$ROOT_TOKEN" # Asegurarse de que el token esté disponible
    
    vault operator unseal $UNSEAL_KEY
    echo "Vault desbloqueado."

    # ! --- LLAMADA AL SCRIPT DE CONFIGURACIÓN COMPLETO (configure_vault.sh) ---
    # Se ejecuta configure_vault.sh en cada arranque para asegurar que las políticas,
    # secretos y roles estén actualizados en caso de cambios en los archivos de configuración.
    /app-scripts/configure_vault.sh
    # ! ---------------------------------------------------------------------

    backup_vault_credentials # Realizar backup en cada arranque (se sobrescribirá el anterior)
fi

# ! --- OPCIONAL: LLAMADA AL SCRIPT DE ACTUALIZACIÓN DE SECRETOS (update_dynamic_secrets.sh) ---
# Si queremos que los secretos como jwt_secret, db_user, etc. se randomicen en CADA ARRANQUE,
# podemos DESCOMENTAR la siguiente línea.
# PERO CUIDADO: Esto generará nuevas credenciales en cada inicio del contenedor,
# lo que podría romper otros servicios que esperan credenciales estables.
# Si estos secretos deben ser estables o rotarse manualmente, NO descomentes esto.
# /app-scripts/update_dynamic_secrets.sh
# ! -------------------------------------------------------------------------------------------


# =============================================
# CONFIGURACIÓN DE ZAP
# =============================================

echo "Iniciando ZAP..."
/zap/zap.sh -daemon -host 0.0.0.0 -port 8081 \
  -config api.key=${ZAP_API_KEY:-my_zap_api_key} \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true &

# Esperar que ZAP esté listo
echo "Esperando que ZAP esté listo..."
# Usamos un curl más robusto para ZAP
while ! curl -sSf http://localhost:8081/JSON/core/view/version >/dev/null 2>&1; do
  sleep 2
done
echo "ZAP está listo."

# =============================================
# MANTENER CONTENEDOR EN EJECUCIÓN
# =============================================

echo "Todos los servicios están listos"
echo "================================="
echo "URL Vault UI: https://localhost:8200"
echo "Token UI: $(cat /vault/data/ui_token.txt)"
echo "Usuario admin: transcendence-admin"
echo "================================="

# =============================================
# CONFIGURACIÓN DE ENLACES PARA REPORTES
# =============================================

echo "Configurando acceso a reportes..."
mkdir -p /var/www/html/zap_reports
ln -sf /zap/reports/zap_report.html /var/www/html/zap_reports/zap_report.html
ln -sf /zap/reports/security_report.html /var/www/html/zap_reports/security_report.html
chown -R www-data:www-data /var/www/html/zap_reports
chmod -R 755 /var/www/html/zap_reports
echo "Enlaces de reportes configurados."

# Mantener el contenedor en ejecución
tail -f /dev/null
