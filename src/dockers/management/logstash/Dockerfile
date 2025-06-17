FROM docker.elastic.co/logstash/logstash:8.12.0

USER root

# Instalación optimizada del plugin Prometheus
RUN logstash-plugin install --no-verify logstash-output-prometheus && \
    rm -rf /usr/share/logstash/vendor/bundle/jruby/2.6.0/cache/*

# Crear estructura de directorios optimizada
RUN mkdir -p /usr/share/logstash/{config,pipeline,data} && \
    chown -R logstash:logstash /usr/share/logstash/config && \
    chown -R logstash:logstash /usr/share/logstash/pipeline && \
    chown -R logstash:logstash /usr/share/logstash/data

# Copiar configuraciones (con caché Docker optimizado)
COPY --chown=logstash:logstash config/ /usr/share/logstash/config/
COPY --chown=logstash:logstash pipeline/ /usr/share/logstash/pipeline/
COPY --chown=logstash:logstash entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

USER logstash

VOLUME /usr/share/logstash/data
EXPOSE 5000 8082 9600 9800

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["-f", "/usr/share/logstash/pipeline/logstash.conf"]