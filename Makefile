all: setup
	@make setup
	@docker compose -f ./src/docker-compose.yml up -d --build

down:
	@docker compose -f ./src/docker-compose.yml down -v

clean:
	sudo rm -rf /home/davgalle/data/sqlite/*
	sudo rm -rf /home/davgalle/data/app/*
	sudo rm -rf /home/davgalle/data/php/*
	sudo rm -rf /home/davgalle/data/frontend/*
	sudo rm -rf /home/davgalle/data/blockchain/*
	sudo rm -rf /home/davgalle/data/security/*
	@if docker ps -qa | grep -q .; then docker stop $$(docker ps -qa); fi
	@if docker ps -qa | grep -q .; then docker rm $$(docker ps -qa); fi
	@if docker images -qa | grep -q .; then docker rmi $$(docker images -qa); fi
	@if docker volume ls -q | grep -q .; then docker volume rm $$(docker volume ls -q); fi
	@if docker network ls --filter name=transcendence -q | grep -q .; then docker network rm transcendence; fi

setup:
	@mkdir -p /home/davgalle/data
	@mkdir -p /home/davgalle/data/sqlite
	@mkdir -p /home/davgalle/data/app
	@mkdir -p /home/davgalle/data/php
	@mkdir -p /home/davgalle/data/frontend
	@mkdir -p /home/davgalle/data/blockchain
	@mkdir -p /home/davgalle/data/security

#access_data:
#	docker exec -it sqlite3 sqlite -u root -p -e "USE wordpress; SELECT * FROM wp_users;"

logs:
  docker compose -f ./src/docker-compose.yml logs -f

.PHONY: all down clean setup