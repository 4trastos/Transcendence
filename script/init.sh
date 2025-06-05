#!/bin/bash

# 1. Envía un dato de prueba a Logstash para forzar la creación del índice
docker exec -it logstash curl -X POST -H "Content-Type: application/json" -d '{"time": 1678886400000, "level": 30, "msg": "Initialization log"}' http://logstash:8082

# 2. Espera a que Elasticsearch indexe el dato (ajusta el tiempo según necesidad)
sleep 10

# 3. Verifica que el índice se haya creado
INDEX_NAME="transcendence-$(date +%Y.%m.%d)"
if docker exec -it elasticsearch curl -u elastic:tu_contraseña -s "http://elasticsearch:9200/_cat/indices/$INDEX_NAME?v" | grep -q "$INDEX_NAME"; then
    echo "Índice $INDEX_NAME creado correctamente."
else
    echo "Error: El índice no se creó."
    exit 1
fi

# 4. Crea el Data View en Kibana (via API)
curl -X POST "http://kibana:5601/api/data_views/data_view" \
    -H "kbn-xsrf: true" \
    -H "Content-Type: application/json" \
    -u elastic:tu_contraseña \
    -d '{
        "data_view": {
            "title": "transcendence-*",
            "name": "Transcendence Logs",
            "timeFieldName": "@timestamp"
        }
    }'

echo "Data View creado en Kibana."