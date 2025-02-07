FROM iniweb/owasp-zap2docker-stable

# Copiar el script de reglas de escaneo desde la carpeta tools a /zap/wrk/
COPY tools/zap_rules/zap_scan.sh /zap/wrk/zap_scan.sh

# Dar permisos de ejecución al script dentro del contenedor
RUN chmod +x /zap/wrk/zap_scan.sh

# Exponer el puerto 8081 para la interfaz web de ZAP
EXPOSE 8081

# Iniciar OWASP ZAP en modo daemon, accesible desde todas las interfaces
CMD ["zap.sh", "-daemon", "-host", "0.0.0.0", "-port", "8081", "&&", "/zap/wrk/zap_scan.sh"]