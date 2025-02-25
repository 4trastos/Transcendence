FROM softwaresecurityproject/zap-stable

USER root

RUN mkdir -p /zap/wrk/

# Instalar dependencias
RUN apt-get update && apt-get install -y firefox-esr

# Copiar el script de escaneo
COPY zap_scan.sh /zap/wrk/zap_scan.sh
RUN chmod +x /zap/wrk/zap_scan.sh

# Copiar el script de API Key
COPY get_zap_api_key.sh /zap/wrk/get_zap_api_key.sh
RUN chmod +x /zap/wrk/get_zap_api_key.sh

EXPOSE 8081

# ENTRYPOINT que espera a ZAP y luego ejecuta el script
COPY entrypoint.sh /zap/wrk/entrypoint.sh
RUN chmod +x /zap/wrk/entrypoint.sh
ENTRYPOINT ["/zap/wrk/entrypoint.sh"]

# Iniciar OWASP ZAP en modo daemon, accesible desde todas las interfaces
# CMD ["sh", "-c", "/zap/zap.sh -daemon -host 0.0.0.0 -port 8081 && /zap/wrk/zap_scan.sh"]
