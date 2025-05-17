FROM docker.elastic.co/logstash/logstash:8.12.0

USER root

# Instalar el plugin Prometheus ANTES de copiar archivos de configuración
RUN logstash-plugin install logstash-output-prometheus

# Crear directorios necesarios
RUN mkdir -p /usr/share/logstash/{config,pipeline,data}

# Copiar configuraciones
COPY config/* /usr/share/logstash/config/
COPY pipeline/* /usr/share/logstash/pipeline/

# Entrypoint
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Ajustar permisos
RUN chown -R logstash:logstash /usr/share/logstash

USER logstash

VOLUME /usr/share/logstash/data
EXPOSE 5000 8082 9600 9800

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["-f", "/usr/share/logstash/pipeline/logstash.conf"]