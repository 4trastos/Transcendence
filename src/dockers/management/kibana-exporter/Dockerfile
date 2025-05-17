FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir flask requests prometheus_client

COPY exporter.py .

ENV KIBANA_USERNAME=elastic \
    KIBANA_PASSWORD_FILE=/usr/share/elasticsearch/secrets/elastic_password

CMD ["python", "exporter.py"]