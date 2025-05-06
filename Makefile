all: grant_permissions restart_if_needed setup
	@docker compose -f ./src/docker-compose.yml up -d --build
	@clear
	@./script/loading.sh 
	@clear
	@./script/display_art.sh

grant_permissions:
	@chmod +x ./script/loading.sh
	@chmod +x ./script/verify_user.sh
	@chmod +x ./script/display_art.sh
	@chmod +x ./script/jwt_tools.sh
	@chmod +x ./script/display_help.sh
	@chmod +x ./script/2fa_tools.sh
	@chmod +x ./script/email_report.sh

kill_docker:
	@./script/kill_docker.sh
	@open /Applications/Docker.app

restart_if_needed:
	@if [ ! -d "$(HOME)/goinfre/data" ]; then \
		echo "No se encuentra el directorio $(HOME)/goinfre/data. Comprobando el estado de Docker..."; \
		if docker ps -q > /dev/null; then \
			echo "Docker se está ejecutando. Deteniendo Docker..."; \
			$(MAKE) kill_docker; \
		else \
			echo "Docker no se está ejecutando. No es necesario detenerlo."; \
		fi; \
		if uname -s | grep -i darwin > /dev/null; then \
			echo "Ejecutándose en macOS. Iniciando Docker..."; \
			open /Applications/Docker.app; \
		elif uname -s | grep -i linux > /dev/null; then \
			echo "Ejecutando en Linux. Iniciando Docker..."; \
			sudo systemctl start docker; \
		fi; \
		echo "Esperando que Docker se inicie..."; \
		sleep 10; \
		while ! docker ps > /dev/null 2>&1; do \
			echo "Esperando que Docker esté listo..."; \
			sleep 5; \
		done; \
		echo "Docker está listo."; \
	elif ! docker ps -q > /dev/null; then \
		echo "Docker no se está ejecutando. Iniciando Docker..."; \
		if uname -s | grep -i darwin > /dev/null; then \
			echo "Ejecutándose en macOS. Iniciando Docker..."; \
			open /Applications/Docker.app; \
		elif uname -s | grep -i linux > /dev/null; then \
			echo "Ejecutando en Linux. Iniciando Docker..."; \
			sudo systemctl start docker; \
		fi; \
		echo "Esperando que Docker se inicie..."; \
		sleep 10; \
		while ! docker ps > /dev/null 2>&1; do \
			echo "Esperando que Docker esté listo..."; \
			sleep 5; \
		done; \
		echo "Docker está listo."; \
	else \
		echo "El directorio $(HOME)/goinfre/data existe. No es necesario reiniciar Docker."; \
	fi


down:
	@docker compose -f ./src/docker-compose.yml down -v

clean:
	rm -rf $(HOME)/goinfre/data/sqlite/*
	rm -rf $(HOME)/goinfre/data/app/*
	rm -rf $(HOME)/goinfre/data/php/*
	rm -rf $(HOME)/goinfre/data/frontend/*
	rm -rf $(HOME)/goinfre/data/blockchain/*
	rm -rf $(HOME)/goinfre/data/security/*
	rm -rf $(HOME)/goinfre/data/vault/*
	rm -rf $(HOME)/goinfre/data/elasticsearch/*
	rm -rf $(HOME)/goinfre/data/logstash/*
	rm -rf $(HOME)/goinfre/data/grafana/*
	rm -rf $(HOME)/goinfre/data/prometheus/*
	rm -rf $(HOME)/goinfre/data/mail/*
	rm -rf $(HOME)/goinfre/data/mail-state/*
	rm -rf $(HOME)/goinfre/data/es_secrets/*
	rm -rf $(HOME)/goinfre/data/es_data/*
	rm -rf $(HOME)/goinfre/data/es_certs/*
	rm -rf $(HOME)/goinfre/data/ls_config/*
	rm -rf $(HOME)/goinfre/data/ls_pipeline/*
	rm -rf $(HOME)/goinfre/data
	@if docker ps -qa | grep -q .; then docker stop $$(docker ps -qa); fi
	@if docker ps -qa | grep -q .; then docker rm $$(docker ps -qa); fi
	@if docker images -qa | grep -q .; then docker rmi $$(docker images -qa); fi
	@if docker volume ls -q | grep -q .; then docker volume rm $$(docker volume ls -q); fi
	@if docker network ls --filter name=transcendence -q | grep -q .; then docker network rm transcendence; fi

setup:
	@mkdir -p $(HOME)/goinfre
	@mkdir -p $(HOME)/goinfre/data
	@mkdir -p $(HOME)/goinfre/data/sqlite
	@mkdir -p $(HOME)/goinfre/data/app
	@mkdir -p $(HOME)/goinfre/data/php
	@mkdir -p $(HOME)/goinfre/data/frontend
	@mkdir -p $(HOME)/goinfre/data/blockchain
	@mkdir -p $(HOME)/goinfre/data/security
	@mkdir -p $(HOME)/goinfre/data/vault
	@mkdir -p $(HOME)/goinfre/data/elasticsearch
	@mkdir -p $(HOME)/goinfre/data/logstash
	@mkdir -p $(HOME)/goinfre/data/grafana
	@mkdir -p $(HOME)/goinfre/data/prometheus
	@mkdir -p $(HOME)/goinfre/data/mail
	@mkdir -p $(HOME)/goinfre/data/mail-state
	@mkdir -p $(HOME)/goinfre/data/es_secrets
	@mkdir -p $(HOME)/goinfre/data/es_data
	@mkdir -p $(HOME)/goinfre/data/es_certs
	@mkdir -p $(HOME)/goinfre/data/ls_config
	@mkdir -p $(HOME)/goinfre/data/ls_pipeline

re: down all

delete:
	@docker compose -f ./src/docker-compose.yml down -v
	@if docker volume ls -qf "name=transcendence" | grep -q .; then \
		docker volume rm $$(docker volume ls -qf "name=transcendence"); \
	else \
		echo "No transcendence volumes to remove."; \
	fi
	@docker system prune --volumes -a

ps:
	@docker compose -f ./src/docker-compose.yml ps -a

logs:
	@docker compose -f ./src/docker-compose.yml logs

logs_service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Por favor, especifica un servicio. Uso: make logs_service SERVICE=<nombre_del_servicio>"; \
	else \
		docker compose -f ./src/docker-compose.yml logs $(SERVICE); \
	fi

scan:
	@docker exec -it security /zap/wrk/zap_scan.sh


security:
	@echo "Ejecutando pruebas de seguridad..."
	@docker exec security mkdir -p /zap/reports
	@docker cp script/security_test.sh security:/tmp/security_test.sh
	@docker exec security chmod +x /tmp/security_test.sh
	@docker exec security /tmp/security_test.sh
	@echo "Reportes disponibles en:"
	@echo "- Resumen de seguridad: https://localhost/zap_reports/security_report.html"
	@echo "- Reporte detallado de ZAP: https://localhost/zap_reports/zap_report.html"

token:
	@docker exec -it security cat /vault/data/ui_token.txt

help: grant_permissions
	@./script/display_help.sh

jwt: grant_permissions
	@./script/jwt_tools.sh jwt

verify: grant_permissions
	@./script/verify_user.sh $(user)

2fa: grant_permissions
	@./script/2fa_tools.sh $(user)

email: grant_permissions
	@./script/email_report.sh

elastic-password:
	@docker exec elasticsearch cat /usr/share/elasticsearch/secrets/elastic_password

.PHONY: all down clean setup delete logs logs_service ps re help scan security token verify jwt 2fa email elastic-password
