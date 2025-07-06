FROM softwaresecurityproject/zap-stable

#WORKDIR /zap/wrk/

USER root

# Definir variables de entorno
ENV MOZ_HEADLESS=1

# Crear usuario y grupo vault si no existen
RUN getent group vault || groupadd -r vault && \
    getent passwd vault || useradd -r -g vault vault

# Crear todos los directorios y asignar permisos
RUN mkdir -p \
        /zap/wrk \
        /zap/wrk/tls \
        /root/.ZAP/firefox \
        /etc/vault/tls \
        /etc/vault/data \
        /etc/vault/policies \
        /vault/backup \
        /ca \
    && chown -R vault:vault /vault \
    && chmod -R 755 /zap/wrk /etc/vault

# Instalar todas las dependencias y Vault en una única capa
RUN apt-get update && apt-get install -y \
        wget \
        unzip \
        firefox-esr \
        jq \
        openssl \
        nmap \
        cron \
        netcat-traditional \
    && wget https://releases.hashicorp.com/vault/1.13.0/vault_1.13.0_linux_amd64.zip \
    && unzip vault_1.13.0_linux_amd64.zip \
    && mv vault /usr/local/bin/ \
    && rm vault_1.13.0_linux_amd64.zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app-scripts 

# Copiar scripts y configuraciones
COPY vault/policy.hcl /etc/vault/policy.hcl
COPY vault/prometheus.hcl /etc/vault/prometheus.hcl
COPY vault/vault.hcl /etc/vault/vault.hcl

COPY vault/configure_vault.sh /app-scripts/configure_vault.sh
COPY vault/update_dynamic_secrets.sh /app-scripts/update_dynamic_secrets.sh 

COPY vault/openssl.cnf /app-scripts/openssl.cnf 
COPY vault/generate_secret_id.sh /app-scripts/generate_secret_id.sh 
COPY zap/zap_scan.sh /app-scripts/zap_scan.sh 
COPY zap/get_zap_api_key.sh /app-scripts/get_zap_api_key.sh 
COPY vault/get_vault_secrets.sh /app-scripts/get_vault_secrets.sh 

COPY zap/entrypoint.sh /usr/local/bin/entrypoint.sh

# Permisos para configuraciones y scripts
RUN chmod 644 /etc/vault/policy.hcl /etc/vault/prometheus.hcl /etc/vault/vault.hcl \
    && chmod 755 /app-scripts/*.sh \
    && chmod 644 /app-scripts/*.cnf \
    && chmod +x /usr/local/bin/entrypoint.sh \
    && chown -R vault:vault /vault

# Healthcheck de Vault
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -k -s -o /dev/null -w "%{http_code}" https://localhost:8200/v1/sys/health | grep -q 200 || exit 1


EXPOSE 8081 8200

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
