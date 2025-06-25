FROM node:18-bullseye

WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y tzdata && \
    rm -rf /var/lib/apt/lists/*

ENV TZ=Europe/Madrid

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p /usr/src/app/data

EXPOSE 3000
CMD ["node", "app.js"]
