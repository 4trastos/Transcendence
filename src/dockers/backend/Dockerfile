FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add --no-cache tzdata
ENV TZ=Europe/Madrid

RUN npm install --production 
RUN npm install cors
RUN npm install node-vault
RUN npm install jsonwebtoken
RUN npm install speakeasy
RUN npm install qrcode
RUN npm install joi
RUN npm install nodemailer
RUN npm install morgan
RUN npm install helmet
RUN npm install bcrypt
RUN npm install fastify @fastify/helmet @fastify/cors @fastify/session @fastify/rate-limit @fastify/auth @fastify/cookie
RUN npm install prom-client

COPY . .

RUN mkdir -p /usr/src/app/data

EXPOSE 3000

CMD ["node", "app.js"]