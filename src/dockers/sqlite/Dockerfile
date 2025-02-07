FROM alpine:latest

RUN apk update && apk add sqlite

RUN mkdir -p /var/lib/sqlite

WORKDIR /var/lib/sqlite

# Usa un archivo de base de datos si quieres iniciar sqlite3 con un archivo
CMD ["sqlite3", "mydatabase.db"] 
