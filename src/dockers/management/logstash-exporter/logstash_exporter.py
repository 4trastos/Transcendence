from flask import Flask, Response
import requests
import os
from prometheus_client import CollectorRegistry, Gauge, generate_latest

app = Flask(__name__)

LOGSTASH_URL = os.getenv("LOGSTASH_URL", "https://logstash:9600/_node/stats")
VERIFY_SSL = os.getenv("VERIFY_SSL", "false").lower() == "true"

@app.route("/metrics")
def metrics():
    registry = CollectorRegistry()
    
    try:
        res = requests.get(LOGSTASH_URL, verify=VERIFY_SSL, timeout=5)
        res.raise_for_status()
        stats = res.json()

        events_in = Gauge("logstash_events_in", "Number of input events", registry=registry)
        events_out = Gauge("logstash_events_out", "Number of output events", registry=registry)
        queue_push_duration = Gauge("logstash_queue_push_duration_avg", "Average queue push duration in ms", registry=registry)

        events_in.set(stats["events"].get("in", 0))
        events_out.set(stats["events"].get("out", 0))

        queue = stats.get("pipelines", {}).get("main", {}).get("queue", {})
        push_duration = queue.get("events", {}).get("push_duration_in_millis", 0)
        queue_push_duration.set(push_duration)

    except Exception as e:
        print("Error fetching Logstash stats:", e)

    return Response(generate_latest(registry), mimetype="text/plain")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9811)

