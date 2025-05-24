FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production
RUN npm install express sqlite3 cors

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]