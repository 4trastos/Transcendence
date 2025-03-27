FROM docker.elastic.co/logstash/logstash:8.12.0

# Cambiar temporalmente a root para configuraciones
USER root

# Copiar configuración
COPY config/logstash.yml /usr/share/logstash/config/
COPY pipeline/logstash.conf /usr/share/logstash/pipeline/

# Copiar y dar permisos al entrypoint de forma segura
COPY entrypoint.sh /tmp/entrypoint.sh
RUN chmod +x /tmp/entrypoint.sh && \
    mv /tmp/entrypoint.sh /usr/local/bin/

# Volver al usuario logstash (normalmente uid 1000)
USER 1000

EXPOSE 5044 9600
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]