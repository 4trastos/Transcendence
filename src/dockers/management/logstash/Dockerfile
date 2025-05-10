FROM docker.elastic.co/logstash/logstash:8.12.0

USER root

RUN mkdir -p /usr/share/logstash/{config,pipeline,data}

COPY config/* /usr/share/logstash/config/
COPY pipeline/* /usr/share/logstash/pipeline/

# Entrypoint
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Ajustar permisos
RUN chown -R logstash:logstash /usr/share/logstash

USER logstash

VOLUME /usr/share/logstash/data
EXPOSE 5044 9600

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["-f", "/usr/share/logstash/pipeline/logstash.conf"]