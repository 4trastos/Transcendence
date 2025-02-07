all: setup
	@make setup
	@docker compose -f ./src/docker-compose.yml up -d --build

down:
	@docker compose -f ./src/docker-compose.yml down -v

clean:
	sudo rm -rf /Users/usuario/data/sqlite/*
	sudo rm -rf /Users/usuario/data/app/*
	sudo rm -rf /Users/usuario/data/php/*
	sudo rm -rf /Users/usuario/data/frontend/*
	sudo rm -rf /Users/usuario/data/blockchain/*
	sudo rm -rf /Users/usuario/data/security/*
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

#access_data:
#	docker exec -it sqlite3 sqlite -u root -p -e "USE wordpress; SELECT * FROM wp_users;"

logs:
	docker compose -f ./src/docker-compose.yml logs -f

.PHONY: all down clean setup