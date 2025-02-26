FROM softwaresecurityproject/zap-stable

USER root

RUN mkdir -p /zap/wrk/
RUN mkdir -p /root/.ZAP/firefox
RUN export MOZ_HEADLESS=1

# Instalar dependencias
RUN apt-get update && apt-get install -y apache2 libapache2-mod-security2 && \
    apt-get clean

# Instalar HashiCorp Vault
RUN apt-get update && apt-get install -y wget \
    unzip && wget https://releases.hashicorp.com/vault/1.13.0/vault_1.13.0_linux_amd64.zip && \
    unzip vault_1.13.0_linux_amd64.zip && \
    mv vault /usr/local/bin/ && rm vault_1.13.0_linux_amd64.zip && \
    apt-get clean

# Instalar Firefox
RUN apt-get update && apt-get install -y firefox-esr && apt-get clean

# Copiar scripts y configuraciones
COPY /zap/zap_scan.sh /zap/wrk/zap_scan.sh
COPY /zap/get_zap_api_key.sh /zap/wrk/get_zap_api_key.sh
COPY /zap/entrypoint.sh /zap/wrk/entrypoint.sh
COPY /mod/modsecurity.conf /etc/modsecurity/modsecurity.conf

# Dar permisos de ejecución a los scripts
RUN chmod +x /zap/wrk/get_zap_api_key.sh
RUN chmod +x /zap/wrk/zap_scan.sh
RUN chmod +x /zap/wrk/entrypoint.sh

EXPOSE 8081 8200

WORKDIR /zap/wrk/

ENTRYPOINT ["/zap/wrk/entrypoint.sh"]
#CMD ["/zap/zap.sh", "-daemon", "-host", "0.0.0.0", "-port", "8081"]
