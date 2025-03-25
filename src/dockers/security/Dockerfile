FROM softwaresecurityproject/zap-stable

WORKDIR /zap/wrk/

USER root

# Definir variables de entorno al inicio
ENV MOZ_HEADLESS=1

# Crear directorios necesarios
RUN mkdir -p /zap/wrk/ && \
    mkdir -p /zap/wrk/tls && \
    mkdir -p /root/.ZAP/firefox && \
    mkdir -p /etc/vault/tls && \
    mkdir -p /etc/vault/data && \
    mkdir -p /ca && \
    chmod -R 755 /zap/wrk /etc/vault

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    firefox-esr \
    jq \
    openssl \
    && apt-get clean

# Instalar HashiCorp Vault
RUN apt-get update && apt-get install -y wget \
unzip && wget https://releases.hashicorp.com/vault/1.13.0/vault_1.13.0_linux_amd64.zip && \
unzip vault_1.13.0_linux_amd64.zip && \
mv vault /usr/local/bin/ && rm vault_1.13.0_linux_amd64.zip && \
apt-get clean

# =============================================
# AUTOMATIZACION DE VAULT
# =============================================

# Crear directorio para políticas
RUN mkdir -p /etc/vault/policies

# Copiar archivos de configuración
COPY vault/policy.hcl /etc/vault/policy.hcl
COPY vault/configure_vault.sh /etc/vault/configure_vault.sh

# Permisos adicionales
RUN chmod 644 /etc/vault/policy.hcl && \
    chmod 750 /etc/vault/configure_vault.sh

# =============================================
# Verificación Automática (Healthcheck)
# =============================================

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -k -s -o /dev/null -w "%{http_code}" https://localhost:8200/v1/sys/health | grep -q 200 || exit 1

# Instalar Firefox
RUN apt-get update && apt-get install -y firefox-esr && apt-get clean

# Instalar jq (herramienta de línea de comandos para procesar JSON)
RUN apt-get update && apt-get install -y jq

# Copiar scripts y configuraciones
COPY zap/zap_scan.sh /zap/wrk/zap_scan.sh
COPY zap/get_zap_api_key.sh /zap/wrk/get_zap_api_key.sh
COPY zap/entrypoint.sh /zap/wrk/entrypoint.sh
COPY vault/get_vault_secrets.sh /zap/wrk/get_vault_secrets.sh
COPY vault/vault.hcl /etc/vault/vault.hcl
COPY vault/openssl.cnf /zap/wrk/openssl.cnf
COPY vault/policy.hcl /etc/vault/policy.hcl

# Dar permisos de ejecución a los scripts
RUN chown -R 996:996 /etc/vault
RUN chmod +x /zap/wrk/*.sh

EXPOSE 8081 8200

ENTRYPOINT ["/zap/wrk/entrypoint.sh"]