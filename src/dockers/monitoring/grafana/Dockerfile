FROM grafana/grafana:latest

<<<<<<< HEAD
USER root

# Instalar dependencias para generar certificados
RUN apk add --no-cache openssl

# Instalar dependencias Y generar certificados automáticamente
RUN apk add --no-cache openssl && \
    mkdir -p /etc/grafana/ssl && \
    openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
      -keyout /etc/grafana/ssl/grafana.key -out /etc/grafana/ssl/grafana.crt \
      -subj "/CN=grafana" && \
    chown -R 472:472 /etc/grafana/ssl && \
    chmod 750 /etc/grafana/ssl && \
    chmod 600 /etc/grafana/ssl/grafana.key

# Directorios de configuración
RUN mkdir -p /etc/grafana/provisioning/dashboards /docker-entrypoint && \
    chown -R 472:472 /etc/grafana/provisioning /docker-entrypoint && \
    chmod -R 755 /etc/grafana/provisioning /docker-entrypoint

# Copiar archivos
COPY grafana.ini /etc/grafana/grafana.ini
COPY datasources.yaml /etc/grafana/provisioning/datasources/datasources.yaml
COPY dashboards.yaml /etc/grafana/provisioning/dashboards/dashboards.yaml
COPY elasticsearch.json /etc/grafana/provisioning/dashboards/elasticsearch.json
COPY node_exporter.json /etc/grafana/provisioning/dashboards/node_exporter.json
COPY entrypoint.sh /docker-entrypoint/entrypoint.sh

# Permisos
RUN chmod +x /docker-entrypoint/entrypoint.sh && \
    chown 472:472 /docker-entrypoint/entrypoint.sh

USER 472

EXPOSE 3000
=======
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
>>>>>>> integration
ENTRYPOINT ["/docker-entrypoint/entrypoint.sh"]