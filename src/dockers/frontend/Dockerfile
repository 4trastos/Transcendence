FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Instala las dependencias
RUN npm install

COPY . .

# Construye la aplicación
#RUN npm run build

# Expone el puerto
EXPOSE 3001

# Comando para iniciar la aplicación en modo desarrollo
CMD ["npm", "run", "dev"]