FROM debian:bullseye-slim

# Instalar dependencias
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl ca-certificates openssl && \
    rm -rf /var/lib/apt/lists/*

# Instalar Prometheus
ENV PROM_VERSION=2.52.0
RUN curl -LO https://github.com/prometheus/prometheus/releases/download/v${PROM_VERSION}/prometheus-${PROM_VERSION}.linux-amd64.tar.gz && \
    tar -xzf prometheus-${PROM_VERSION}.linux-amd64.tar.gz && \
    mv prometheus-${PROM_VERSION}.linux-amd64 /opt/prometheus && \
    ln -s /opt/prometheus/prometheus /usr/local/bin/prometheus && \
    ln -s /opt/prometheus/promtool /usr/local/bin/promtool && \
    rm prometheus-${PROM_VERSION}.linux-amd64.tar.gz

# Crear estructura de directorios
RUN mkdir -p /etc/prometheus/certs /prometheus/data && \
    chown -R nobody:nogroup /etc/prometheus /prometheus && \
    chmod -R 750 /etc/prometheus/certs && \
    chmod 755 /prometheus/data

# Copiar archivos de configuración
COPY prometheus.yml alert_rules.yml web-config.yml /etc/prometheus/
COPY entrypoint.sh /prometheus/scripts/entrypoint.sh
RUN chmod +x /prometheus/scripts/entrypoint.sh

USER nobody
EXPOSE 9090
ENTRYPOINT ["/prometheus/scripts/entrypoint.sh"]