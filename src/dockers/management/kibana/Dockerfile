FROM docker.elastic.co/kibana/kibana:8.12.0

USER root
RUN mkdir -p /usr/share/kibana/dashboards && \
    chown -R kibana:kibana /usr/share/kibana

COPY --chown=kibana:kibana config/kibana.yml /usr/share/kibana/config/
COPY --chown=kibana:kibana entrypoint.sh /usr/local/bin/
COPY --chown=kibana:kibana dashboards/ /usr/share/kibana/dashboards/

RUN chmod 755 /usr/local/bin/entrypoint.sh

USER kibana
EXPOSE 5601
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
