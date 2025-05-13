FROM docker.elastic.co/kibana/kibana:8.12.0

USER root

RUN apt-get update && \
    apt-get install -y jq curl gettext-base python3 python3-pip && \
    pip3 install pyyaml && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /usr/share/kibana/{logs,data,config} && \
    chown -R kibana:kibana /usr/share/kibana && \
    chmod -R 775 /usr/share/kibana && \
    touch /usr/share/kibana/logs/kibana.log && \
    chown kibana:kibana /usr/share/kibana/logs/kibana.log && \
    chmod 664 /usr/share/kibana/logs/kibana.log

COPY --chown=kibana:kibana config/kibana.yml /usr/share/kibana/config/
COPY --chown=kibana:kibana entrypoint.sh /usr/local/bin/
COPY --chown=kibana:kibana dashboards/ /usr/share/kibana/dashboards/

RUN chmod 755 /usr/local/bin/entrypoint.sh

USER kibana

EXPOSE 5601
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]