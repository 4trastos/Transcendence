FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production 
RUN npm install cors
RUN npm install node-vault
RUN npm install jsonwebtoken
RUN npm install joi
RUN npm install express-rate-limit
#RUN npm install pyotp

COPY . .

# Crear la carpeta para la base de datos SQLite dentro del contenedor
RUN mkdir -p /usr/src/app/data

# Copiar init.sql al volumen compartido
COPY tools/init.sql /var/lib/sqlite/init.sql

EXPOSE 3000

CMD ["npm", "node", "app.js"]