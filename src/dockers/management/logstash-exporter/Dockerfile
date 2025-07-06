# Dockerfile
FROM python:3.11-slim

# Variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    LOGSTASH_URL=https://logstash:9600/_node/stats \
    VERIFY_SSL=false

# Instala dependencias
RUN pip install --no-cache-dir flask prometheus_client requests

# Copia la app
COPY logstash_exporter.py /app/logstash_exporter.py
WORKDIR /app

# Expone el puerto para Prometheus
EXPOSE 9811

# Comando por defecto
CMD ["python", "logstash_exporter.py"]
