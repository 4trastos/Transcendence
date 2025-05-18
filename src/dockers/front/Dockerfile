FROM debian:bookworm-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instala Node.js, npm y otras dependencias necesarias
RUN apt-get update && \
    apt-get install -y \
    curl \
    gnupg \
    lsb-release \
    ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Copia los archivos de tu proyecto al contenedor
COPY src/ /app/src/
COPY public/index.html /app/public/index.html
COPY public/images/background_90.jpg /app/public/images/background_90.jpg
COPY /server.js /app/
COPY /tsconfig.json /app/
COPY /tailwind.config.js /app/
COPY /package.json /app/
COPY /tools/init.sh /usr/local/bin/
COPY scripts/ /app/scripts/

RUN chmod +x /usr/local/bin/init.sh

RUN npm install
EXPOSE 3040

ENTRYPOINT [ "/usr/local/bin/init.sh"]
# Usa un comando para mantener el contenedor en ejecución, en caso de que necesites interactuar con él
CMD ["npx", "node", "server.js"]
