FROM alpine:latest

RUN apk update && apk add sqlite

# Crea el directorio de la base de datos
RUN mkdir -p /var/lib/sqlite

COPY script/init_db.sh /var/lib/sqlite/init_db.sh

# Dale permisos de ejecución al script
RUN chmod +x /var/lib/sqlite/init_db.sh

WORKDIR /var/lib/sqlite

# Ejecuta el script al iniciar el contenedor
ENTRYPOINT ["/var/lib/sqlite/init_db.sh"]

# Comando para iniciar SQLite y usar la base de datos del volumen
#CMD ["sqlite3", "sqlite.db"]
