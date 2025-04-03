FROM docker.elastic.co/kibana/kibana:8.12.0

# Cambiar temporalmente a root para configuraciones
USER root

# Copiar configuración
COPY config/kibana.yml /usr/share/kibana/config/

# Copiar entrypoint de forma segura
COPY entrypoint.sh /tmp/entrypoint.sh
RUN chmod +x /tmp/entrypoint.sh && \
    mv /tmp/entrypoint.sh /usr/local/bin/

# Volver al usuario kibana (normalmente uid 1000)
USER 1000

EXPOSE 5601
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]