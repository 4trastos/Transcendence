FROM prom/prometheus:latest

# Copiar configuración
COPY prometheus.yml /etc/prometheus/prometheus.yml

# Crear directorio en /prometheus donde nobody ya tiene permisos
RUN mkdir -p /prometheus/scripts && \
    chown nobody:nobody /prometheus/scripts

# Cambiar a root temporalmente para copiar el entrypoint
USER root
COPY entrypoint.sh /prometheus/scripts/entrypoint.sh
RUN chmod +x /prometheus/scripts/entrypoint.sh
USER nobody

# Puerto expuesto
EXPOSE 9090

# Punto de entrada
ENTRYPOINT ["/prometheus/scripts/entrypoint.sh"]