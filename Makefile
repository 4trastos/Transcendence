all: restart_if_needed setup
	@docker compose -f ./src/docker-compose.yml up -d --build

kill_docker:
	@./script/kill_docker.sh
	@open /Applications/Docker.app

restart_if_needed:
	@if [ ! -d "/Users/usuario/data" ]; then \
		echo "No se encuentra el directorio /Users/usuario/data. Comprobando el estado de Docker..."; \
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
		echo "El directorio /Users/usuario/data existe. No es necesario reiniciar Docker."; \
	fi


down:
	@docker compose -f ./src/docker-compose.yml down -v

clean:
	sudo rm -rf /Users/usuario/data/sqlite/*
	sudo rm -rf /Users/usuario/data/app/*
	sudo rm -rf /Users/usuario/data/php/*
	sudo rm -rf /Users/usuario/data/frontend/*
	sudo rm -rf /Users/usuario/data/blockchain/*
	sudo rm -rf /Users/usuario/data/security/*
	sudo rm -rf /Users/usuario/data
	@if docker ps -qa | grep -q .; then docker stop $$(docker ps -qa); fi
	@if docker ps -qa | grep -q .; then docker rm $$(docker ps -qa); fi
	@if docker images -qa | grep -q .; then docker rmi $$(docker images -qa); fi
	@if docker volume ls -q | grep -q .; then docker volume rm $$(docker volume ls -q); fi
	@if docker network ls --filter name=transcendence -q | grep -q .; then docker network rm transcendence; fi

setup:
	@mkdir -p /Users/usuario/data
	@mkdir -p /Users/usuario/data/sqlite
	@mkdir -p /Users/usuario/data/app
	@mkdir -p /Users/usuario/data/php
	@mkdir -p /Users/usuario/data/frontend
	@mkdir -p /Users/usuario/data/blockchain
	@mkdir -p /Users/usuario/data/security

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

.PHONY: all down clean setup delete logs logs_service ps
