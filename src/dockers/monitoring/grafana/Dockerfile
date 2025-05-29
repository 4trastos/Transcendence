FROM grafana/grafana:latest

USER root

# Crear directorios necesarios
RUN mkdir -p /etc/grafana/ssl /prometheus/certs && \
    chown -R 472:472 /etc/grafana /prometheus/certs && \
    chmod 755 /etc/grafana/ssl && \
    chmod 750 /prometheus/certs

# Instalar dependencias
RUN apk add --no-cache openssl curl

# Copiar configuración
COPY provisioning/ /etc/grafana/provisioning/
COPY grafana.ini /etc/grafana/grafana.ini
COPY entrypoint.sh /entrypoint.sh

# Ajustar permisos
RUN chmod 755 /entrypoint.sh && \
    chown -R 472:472 /etc/grafana/provisioning

USER 472

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]