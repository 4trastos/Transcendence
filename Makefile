DATABASE_YAML = ./kuber/database-deployment.yaml
FRONTEND_YAML = ./kuber/frontend-deployment.yaml
PHP_YAML = ./kuber/php-deployment.yaml
BACKEND_YAML = ./kuber/backend-deployment.yaml
BLOCKCHAIN_YAML = ./kuber/blockchain-deployment.yaml

all: apply_database apply_frontend apply_php apply_backend apply_avalanche check_pods

apply_database:
	kubectl apply -f $(DATABASE_YAML)

apply_frontend:
	kubectl apply -f $(FRONTEND_YAML)

apply_php:
	kubectl apply -f $(PHP_YAML)

apply_backend:
	kubectl apply -f $(BACKEND_YAML)

apply_blockchain:
	kubectl apply -f $(BLOCKCHAIN_YAML)

# Comprobar si los pods están en estado 'Running'
check_pods:
	@if kubectl get pods | grep -q 'Running'; then echo "Todos los pods están corriendo"; else echo "Algunos pods no están corriendo correctamente"; fi

clean:
	kubectl delete -f $(DATABASE_YAML) || true
	kubectl delete -f $(FRONTEND_YAML) || true
	kubectl delete -f $(PHP_YAML) || true
	kubectl delete -f $(BACKEND_YAML) || true
	kubectl delete -f $(BLOCKCHAIN_YAML) || true

# Limpiar los Persistent Volume Claims
clean_pv:
	kubectl delete pvc --all

# Acceder a la base de datos SQLite
access_database:
	kubectl exec -it $(shell kubectl get pod -l app=sqlite -o jsonpath="{.items[0].metadata.name}") -- sqlite3 /data/sqlite/mydb.db "SELECT * FROM users;"

.PHONY: all check_pods clean clean_pv access_database