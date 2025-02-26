all: restart_if_needed setup
	@docker compose -f ./src/docker-compose.yml up -d --build

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
	rm -rf $(HOME)/goinfre/data/modsecurity/*
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
	@mkdir -p $(HOME)/goinfre/data/modsecurity

re: down all

delete:
	@docker compose -f ./src/docker-compose.yml down -v
	@if docker volume ls -qf "name=transcendence" | grep -q .; then \
		docker volume rm $$(docker volume ls -qf "name=transcendence"); \
	else \
		echo "No transcendence volumes to remove."; \
	fi

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

help:
	@echo "Available commands:"
	@echo "  make                     - Restart Docker if needed and build the containers"
	@echo "  make kill_docker         - Kill the Docker process and restart the application"
	@echo "  make restart_if_needed   - Restart Docker only if needed"
	@echo "  make down                - Stop and remove containers"
	@echo "  make clean               - Remove data, containers, images, volumes, and networking"
	@echo "  make setup               - Setup the necessary directories"
	@echo "  make re                  - Stop everything and restart it (down + all)"
	@echo "  make delete              - Remove Docker volumes related to 'transcendence'"
	@echo "  make ps                  - Show the status of containers"
	@echo "  make logs                - Show logs for all services"
	@echo "  make logs_service        - Show logs for a specific service (use: make logs_service SERVICE=<service_name>)"

.PHONY: all down clean setup delete logs logs_service ps re help
