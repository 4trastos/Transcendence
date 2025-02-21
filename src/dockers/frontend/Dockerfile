FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Instala las dependencias, incluyendo el plugin de React
RUN npm install react-dom@18

# Instala las dependencias restantes
RUN npm install

COPY . .

# Ejecuta la compilación del frontend en modo producción
RUN npm run build

# Expone el puerto en desarrollo
EXPOSE 3001

# Comando para iniciar la aplicación en modo desarrollo
# CMD ["npm", "run", "dev"]

# Comando para servir archivos estáticos en producción
#CMD ["npx", "serve", "dist"]
CMD ["npx", "serve", "-s", "dist", "-p", "3001"]