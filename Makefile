all: restart_if_needed setup
	@docker compose -f ./src/docker-compose.yml up -d --build

kill_docker:
	@./script/kill_docker.sh
	@open /Applications/Docker.app

restart_if_needed:
	@if [ ! -d "/Users/usuario/data" ]; then \
		echo "Directory /Users/usuario/data not found. Checking Docker status..."; \
		if docker ps -q > /dev/null; then \
			echo "Docker is running. Stopping Docker..."; \
			$(MAKE) kill_docker; \
		else \
			echo "Docker is not running. No need to stop Docker."; \
		fi; \
		if uname -s | grep -i darwin > /dev/null; then \
			echo "Running on macOS. Starting Docker..."; \
			open /Applications/Docker.app; \
		elif uname -s | grep -i linux > /dev/null; then \
			echo "Running on Linux. Starting Docker..."; \
			sudo systemctl start docker; \
		fi; \
		echo "Waiting for Docker to start..."; \
		sleep 10; \
		while ! docker ps > /dev/null 2>&1; do \
			echo "Waiting for Docker to be ready..."; \
			sleep 5; \
		done; \
		echo "Docker is ready."; \
	elif ! docker ps -q > /dev/null; then \
		echo "Docker is not running. Starting Docker..."; \
		if uname -s | grep -i darwin > /dev/null; then \
			echo "Running on macOS. Starting Docker..."; \
			open /Applications/Docker.app; \
		elif uname -s | grep -i linux > /dev/null; then \
			echo "Running on Linux. Starting Docker..."; \
			sudo systemctl start docker; \
		fi; \
		echo "Waiting for Docker to start..."; \
		sleep 10; \
		while ! docker ps > /dev/null 2>&1; do \
			echo "Waiting for Docker to be ready..."; \
			sleep 5; \
		done; \
		echo "Docker is ready."; \
	else \
		echo "Directory /Users/usuario/data exists. No need to restart Docker."; \
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

logs:
	@docker compose -f ./src/docker-compose.yml logs -f

.PHONY: all down clean setup delete logs
