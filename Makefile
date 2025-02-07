all: setup
	@make setup
	@docker compose -f ./src/docker-compose.yml up -d --build

down:
	@docker compose -f ./src/docker-compose.yml down -v

clean:
	sudo rm -rf /Users/usuario/data/sqlite/*
	sudo rm -rf /users/usuario/data/app/*
	sudo rm -rf /users/usuario/data/php/*
	sudo rm -rf /users/usuario/data/frontend/*
	sudo rm -rf /users/usuario/data/blockchain/*
	sudo rm -rf /users/usuario/data/security/*
	@if docker ps -qa | grep -q .; then docker stop $$(docker ps -qa); fi
	@if docker ps -qa | grep -q .; then docker rm $$(docker ps -qa); fi
	@if docker images -qa | grep -q .; then docker rmi $$(docker images -qa); fi
	@if docker volume ls -q | grep -q .; then docker volume rm $$(docker volume ls -q); fi
	@if docker network ls --filter name=transcendence -q | grep -q .; then docker network rm transcendence; fi

setup:
	@mkdir -p /users/usuario/data
	@mkdir -p /users/usuario/data/sqlite
	@mkdir -p /users/usuario/data/app
	@mkdir -p /users/usuario/data/php
	@mkdir -p /users/usuario/data/frontend
	@mkdir -p /users/usuario/data/blockchain
	@mkdir -p /users/usuario/data/security

#access_data:
#	docker exec -it sqlite3 sqlite -u root -p -e "USE wordpress; SELECT * FROM wp_users;"

logs:
	docker compose -f ./src/docker-compose.yml logs -f

.PHONY: all down clean setup