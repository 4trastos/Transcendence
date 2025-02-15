#!/bin/sh

echo "Ejecutando init_db.sh..."

# Verifica si la base de datos existe
if [ ! -f /var/lib/sqlite/sqlite.db ]; then
    echo "La base de datos no existe. Creando base de datos..."
    sqlite3 /var/lib/sqlite/sqlite.db "CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT);"
    echo "Base de datos creada."
else
    echo "La base de datos ya existe."
fi

# Mantener el contenedor corriendo
tail -f /dev/null
