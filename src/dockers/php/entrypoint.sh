#!/bin/bash
set -e

# Crear el directorio zap_reports en una ruta no montada por un volumen
mkdir -p /zap/reports
chmod -R 777 /zap/reports

# Asegurar que los permisos sean correctos
chown -R www-data:www-data /zap/reports

# Crear un enlace simbólico desde /var/www/html/zap_reports a /zap/reports
ln -sf /zap/reports /var/www/html/zap_reports

# Asegurar que los logs de ModSecurity tengan permisos adecuados
chown -R www-data:www-data /var/log/nginx

# Asegurar que los logs de ModSecurity tengan permisos adecuados
chown -R www-data:www-data /var/log/nginx
# Añadir esta línea para cambiar los permisos de los archivos de log
find /var/log/nginx -type f -exec chmod 644 {} \;

# Ejecutar supervisord
exec /usr/bin/supervisord