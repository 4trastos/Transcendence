#!/bin/sh
set -e

# Verificar configuración
if [ -f "/etc/prometheus/prometheus.yml" ]; then
    echo "Configuración de Prometheus encontrada."
else
    echo "Error: No se encontró el archivo de configuración de Prometheus."
    exit 1
fi

# Iniciar Prometheus
exec /bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/prometheus \
    --web.console.libraries=/usr/share/prometheus/console_libraries \
    --web.console.templates=/usr/share/prometheus/consoles