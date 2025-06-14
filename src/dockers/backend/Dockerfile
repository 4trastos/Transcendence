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