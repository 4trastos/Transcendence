FROM grafana/grafana:latest

# 1. Todas las operaciones como root (usuario por defecto)
USER root

# 2. Crear directorio con permisos adecuados antes de copiar archivos
RUN mkdir -p /docker-entrypoint && \
    chown -R 472:472 /docker-entrypoint && \
    chmod 755 /docker-entrypoint

# 3. Copiar archivos de configuración
COPY grafana.ini /etc/grafana/grafana.ini
COPY datasources.yaml /etc/grafana/provisioning/datasources/datasources.yaml

# 4. Copiar entrypoint al directorio creado
COPY entrypoint.sh /docker-entrypoint/entrypoint.sh
RUN chmod +x /docker-entrypoint/entrypoint.sh && \
    chown 472:472 /docker-entrypoint/entrypoint.sh

# 5. Cambiar al usuario grafana (UID 472) para ejecución
USER 472

# 6. Puerto expuesto
EXPOSE 3000

# 7. Punto de entrada
ENTRYPOINT ["/docker-entrypoint/entrypoint.sh"]