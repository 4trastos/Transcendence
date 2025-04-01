#!/bin/sh
set -e

# Solo asegurar permisos de los datos (elimina la línea del chmod externo)
chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/data

# Ejecutar el comando original
exec /usr/local/bin/docker-entrypoint.sh "$@"