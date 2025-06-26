FROM node:18-bullseye

WORKDIR /usr/src/app

# Copiar el script de inicialización al mismo lugar que el contenedor sqlite
COPY tools/init.sql /var/lib/sqlite/init.sql

RUN apt-get update && \
    apt-get install -y tzdata && \
    rm -rf /var/lib/apt/lists/*

ENV TZ=Europe/Madrid

COPY package*.json ./

RUN npm install

COPY . . 

RUN ls -R /usr/src/app
    
RUN mkdir -p /usr/src/app/data && \
    chown -R node:node /usr/src/app/data

USER node

EXPOSE 3000
CMD ["node", "app.js"]
    