FROM docker.elastic.co/kibana/kibana:8.12.0

USER root

# Copiar configuración
COPY config/kibana.yml /usr/share/kibana/config/

# Copiar entrypoint
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

USER kibana

EXPOSE 5601
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]