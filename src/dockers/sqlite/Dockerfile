FROM alpine:latest

RUN apk update && apk add sqlite

# Crea el directorio de la base de datos
RUN mkdir -p /var/lib/sqlite

# Copiar init.sql a la ruta correcta
COPY tools/init.sql /var/lib/sqlite/init.sql
COPY script/init_db.sh /var/lib/sqlite/init_db.sh

RUN chmod +x /var/lib/sqlite/init_db.sh

WORKDIR /var/lib/sqlite

# Ejecuta el script al iniciar el contenedor
ENTRYPOINT ["/var/lib/sqlite/init_db.sh"]
