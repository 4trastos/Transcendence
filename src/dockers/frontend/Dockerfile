FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add --no-cache tzdata
ENV TZ=Europe/Madrid

RUN npm install react-dom@18
RUN npm install serve --save

# Instala las dependencias restantes
RUN npm install

COPY . .

# Ejecuta la compilación del frontend en modo producción
RUN npm run build

# Expone el puerto en desarrollo
EXPOSE 3001

# Comando para servir archivos estáticos en producción
CMD ["npx", "serve", "-s", "dist", "-p", "3001"]