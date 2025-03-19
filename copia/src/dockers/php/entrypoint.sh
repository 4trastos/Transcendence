#!/bin/bash
set -e

# Crear el directorio zap_reports en una ruta no montada por un volumen
mkdir -p /zap/reports
chmod -R 777 /zap/reports

# Asegurar que los permisos sean correctos
chown -R www-data:www-data /zap/reports

# Crear un enlace simbólico desde /var/www/html/zap_reports a /zap/reports
ln -sf /zap/reports /var/www/html/zap_reports

# Iniciar PHP-FPM y Nginx
php-fpm &
nginx -g 'daemon off;'

# Iniciar Apache
#exec apache2-foreground
