FROM alpine:latest

USER root

RUN apk update && apk add bash curl libc6-compat \
    && curl -L https://github.com/ava-labs/avalanchego/releases/download/v1.9.2/avalanchego-linux-amd64-v1.9.2.tar.gz -o avalanchego.tar.gz \
    && tar -xvf avalanchego.tar.gz \
    && rm -rf /avalanchego \
    && mv avalanchego-v1.9.2 /avalanchego \
    && rm avalanchego.tar.gz \
    && chmod +x /avalanchego/avalanchego

# Copiar el archivo de configuración
COPY config.json /avalanchego/config.json

RUN chmod +x /avalanchego/config.json

# Agregar el binario al PATH
ENV PATH="/avalanchego:${PATH}"

EXPOSE 9650 9651