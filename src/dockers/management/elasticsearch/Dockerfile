FROM docker.elastic.co/elasticsearch/elasticsearch:8.12.0

USER root

# Instalar solo dependencias esenciales (optimizado)
RUN apt-get update && \
    apt-get install -y --no-install-recommends netcat-openbsd jq && \
    rm -rf /var/lib/apt/lists/*

# Configurar directorios con permisos adecuados (optimizado)
RUN mkdir -p /usr/share/elasticsearch/{secrets,config/certs} && \
    chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/{secrets,config} && \
    chmod 750 /usr/share/elasticsearch/secrets && \
    chmod 755 /usr/share/elasticsearch/config

# Copiar configuración mínima
COPY --chown=elasticsearch:elasticsearch config/elasticsearch.yml /usr/share/elasticsearch/config/
COPY --chown=elasticsearch:elasticsearch entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

USER elasticsearch

VOLUME ["/usr/share/elasticsearch/data", "/usr/share/elasticsearch/secrets"]
EXPOSE 9200 9300

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]