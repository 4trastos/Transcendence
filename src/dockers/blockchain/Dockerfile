FROM alpine:latest

# Instalar dependencias
RUN apk update && apk add bash curl

# Descargar e instalar AvalancheGo
RUN curl -L https://github.com/ava-labs/avalanchego/releases/download/v1.9.2/avalanchego-linux-amd64-v1.9.2.tar.gz -o avalanchego.tar.gz \
    && tar -xvf avalanchego.tar.gz \
    && mv avalanchego-v1.9.2 /avalanchego \
    && rm avalanchego.tar.gz

# Agregar el binario al PATH
ENV PATH="/avalanchego:${PATH}"

# Exponer puertos necesarios
EXPOSE 9650 9651

# Comando para iniciar AvalancheGo
CMD ["avalanchego"]

# FROM avaplatform/avalanchego:latest

# RUN mkdir -p /root/.avalanchego

# WORKDIR /avalanchego

# ENV PATH="/avalanchego:${PATH}"

# EXPOSE 9650 9651

# CMD ["avalanchego"]