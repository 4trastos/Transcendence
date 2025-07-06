from flask import Flask, Response
from prometheus_client import Gauge, generate_latest, CollectorRegistry
import requests
import os
import time

app = Flask(__name__)

# Configuración desde variables de entorno
KIBANA_HOST = os.getenv("KIBANA_HOST", "http://kibana:5601")
KIBANA_USER = os.getenv("KIBANA_USERNAME", "elastic")
KIBANA_PASSWORD = os.getenv("KIBANA_PASSWORD", "")
INSECURE = os.getenv("INSECURE_SKIP_VERIFY", "false").lower() == "true"

# Métricas
registry = CollectorRegistry()
kibana_status = Gauge('kibana_status', 'Kibana status (1=up, 0=down)', registry=registry)
response_time = Gauge('kibana_response_time', 'Response time in ms', registry=registry)
heap_used = Gauge('kibana_heap_used_mb', 'Heap used in MB', registry=registry)

@app.route('/metrics')
def get_metrics():
    start_time = time.time()
    
    try:
        # Primera llamada para autenticación y obtener cookies
        auth_url = f"{KIBANA_HOST}/internal/security/login"
        auth_data = {
            "username": KIBANA_USER,
            "password": KIBANA_PASSWORD
        }
        auth_headers = {
            "kbn-xsrf": "true",
            "Content-Type": "application/json"
        }
        
        session = requests.Session()
        auth_res = session.post(
            auth_url,
            json=auth_data,
            headers=auth_headers,
            verify=not INSECURE
        )
        auth_res.raise_for_status()

        # Segunda llamada para obtener métricas
        stats_url = f"{KIBANA_HOST}/api/status"
        stats_res = session.get(
            stats_url,
            headers={"kbn-xsrf": "true"},
            verify=not INSECURE
        )
        stats_res.raise_for_status()
        
        stats = stats_res.json()
        metrics = stats.get("metrics", {})
        
        # Establecer métricas
        kibana_status.set(1)
        heap_used.set(metrics.get("process", {}).get("memory", {}).get("heap", {}).get("used_in_bytes", 0) / (1024 * 1024))
        response_time.set((time.time() - start_time) * 1000)
        
    except Exception as e:
        kibana_status.set(0)
        print(f"Error: {str(e)}")
    
    return Response(generate_latest(registry), mimetype="text/plain")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9201)