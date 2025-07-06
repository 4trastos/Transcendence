FROM docker.elastic.co/kibana/kibana:8.12.0

# Configurar permisos para el volumen
RUN mkdir -p /usr/share/kibana/data && \
    chown -R kibana:kibana /usr/share/kibana/data

# Configuración optimizada
COPY --chown=kibana:kibana config/kibana.yml /usr/share/kibana/config/
COPY --chown=kibana:kibana dashboards/ /usr/share/kibana/dashboards/
COPY --chown=kibana:kibana entrypoint.sh /usr/local/bin/

# Optimización de caché
RUN mkdir -p /usr/share/kibana/optimize && \
    chown -R kibana:kibana /usr/share/kibana/optimize

RUN chmod 755 /usr/local/bin/entrypoint.sh

USER kibana
EXPOSE 5601
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]