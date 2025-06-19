FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add --no-cache tzdata
ENV TZ=Europe/Madrid

RUN npm install

COPY . .

RUN mkdir -p /usr/src/app/data

EXPOSE 3000

CMD ["node", "app.js"]


#FROM node:18-bullseye

#WORKDIR /usr/src/app

#COPY package*.json ./

#RUN apt-get update && \
#    apt-get install -y --no-install-recommends tzdata && \
#    rm -rf /var/lib/apt/lists/*

#ENV TZ=Europe/Madrid

#RUN npm install

#COPY . .

#RUN mkdir -p /usr/src/app/data

#EXPOSE 3000

#CMD ["node", "app.js"]