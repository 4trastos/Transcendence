FROM docker.elastic.co/elasticsearch/elasticsearch:8.12.0

USER root

# Instalar jq para parsear JSON en el entrypoint
RUN apt-get update && apt-get install -y netcat jq && rm -rf /var/lib/apt/lists/*

# Crear directorios necesarios
RUN mkdir -p /usr/share/elasticsearch/secrets && \
    chown -R elasticsearch:root /usr/share/elasticsearch/secrets && \
    chmod 775 /usr/share/elasticsearch/secrets

# Copiar configuración básica
COPY config/elasticsearch.yml /usr/share/elasticsearch/config/
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

USER elasticsearch

VOLUME ["/usr/share/elasticsearch/data", "/usr/share/elasticsearch/secrets"]
EXPOSE 9200 9300

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]