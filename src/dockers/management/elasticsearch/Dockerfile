# dockers/management/elasticsearch/Dockerfile
FROM docker.elastic.co/elasticsearch/elasticsearch:8.12.0

# Cambia a root temporalmente para configuraciones
USER root

# Copia la configuración
COPY config/elasticsearch.yml /usr/share/elasticsearch/config/

# Copia el entrypoint a una ubicación editable
COPY entrypoint.sh /tmp/entrypoint.sh
RUN chmod +x /tmp/entrypoint.sh && \
    mv /tmp/entrypoint.sh /usr/local/bin/

# Vuelve al usuario elasticsearch
USER elasticsearch

VOLUME ["/usr/share/elasticsearch/data"]
EXPOSE 9200 9300
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]