#!/bin/sh

if [ -f /var/lib/sqlite/sqlite.db ]; then
    echo "La base de datos ya existe. No se requiere inicialización."
else
    echo "La base de datos no existe. Creando base de datos..."
    sqlite3 /var/lib/sqlite/sqlite.db < /var/lib/sqlite/init.sql
    echo "Base de datos creada e inicializada con init.sql."
fi

ls -l /var/lib/sqlite

tail -f /dev/null


#if [ ! -f /var/lib/sqlite/sqlite.db ]; then
#    echo "La base de datos ya existe. No se requiere inicialización."
#else
#    echo "La base de datos no existe. Creando base de datos..."
#    sqlite3 /var/lib/sqlite/sqlite.db < /var/lib/sqlite/init.sql
#    echo "Base de datos creada e inicializada con init.sql."
#fi