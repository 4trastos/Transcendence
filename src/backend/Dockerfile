FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Crear la carpeta para la base de datos SQLite dentro del contenedor
RUN mkdir -p /usr/src/app/data

EXPOSE 3000

CMD ["node", "app.js"]