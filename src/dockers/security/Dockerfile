FROM softwaresecurityproject/zap-stable

RUN mkdir -p /zap/wrk/

# Copiar el script de escaneo
COPY tools/zap_scan.sh /zap/wrk/zap_scan.sh
RUN ls -l /zap/wrk/

# Dar permisos de ejecución al script dentro del contenedor
#RUN chmod 755 /zap/wrk/zap_scan.sh

# Exponer el puerto 8081 para la interfaz web de ZAP
EXPOSE 8081

# Iniciar OWASP ZAP en modo daemon, accesible desde todas las interfaces
CMD ["sh", "-c", "/zap/zap.sh -daemon -host 0.0.0.0 -port 8081 && /zap/wrk/zap_scan.sh"]
