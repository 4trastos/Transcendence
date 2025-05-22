FROM debian:bullseye-slim

# Instalar dependencias necesarias
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        openssl \
        tar \
        gzip && \
    rm -rf /var/lib/apt/lists/*

# Definir versión de Prometheus
ENV PROM_VERSION=2.52.0

# Descargar y extraer Prometheus
RUN curl -LO https://github.com/prometheus/prometheus/releases/download/v${PROM_VERSION}/prometheus-${PROM_VERSION}.linux-amd64.tar.gz && \
    tar -xzf prometheus-${PROM_VERSION}.linux-amd64.tar.gz && \
    mv prometheus-${PROM_VERSION}.linux-amd64 /opt/prometheus && \
    ln -s /opt/prometheus/prometheus /usr/local/bin/prometheus && \
    ln -s /opt/prometheus/promtool /usr/local/bin/promtool && \
    rm prometheus-${PROM_VERSION}.linux-amd64.tar.gz

# Crear estructura de directorios
RUN mkdir -p /etc/prometheus/ssl /prometheus /data && \
    chown -R nobody:nogroup /etc/prometheus /prometheus /data && \
    chmod -R 750 /etc/prometheus /data

# Copiar archivos de configuración y scripts
COPY prometheus.yml /etc/prometheus/prometheus.yml
COPY alert_rules.yml /etc/prometheus/alert_rules.yml
COPY web-config.yml /etc/prometheus/web-config.yml
COPY entrypoint.sh /prometheus/scripts/entrypoint.sh

# Asignar permisos
RUN chmod +x /prometheus/scripts/entrypoint.sh

USER nobody

EXPOSE 9090
ENTRYPOINT ["/prometheus/scripts/entrypoint.sh"]
