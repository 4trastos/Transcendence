#!/bin/sh

DB_PATH="/var/lib/sqlite/sqlite.db"
INIT_SCRIPT="/var/lib/sqlite/init.sql"
LOG_PREFIX="[SQLite Init]"

# Función para listar SOLO nombres de tablas
list_tables() {
    echo "$LOG_PREFIX  TABLAS EXISTENTES:"
    sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
}

# Función para verificar la integridad de la BD
verify_db() {
    echo "$LOG_PREFIX  Verificando integridad de la BD..."
    if sqlite3 "$DB_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
        echo "$LOG_PREFIX ✅ Integridad de la BD OK."
        return 0
    else
        echo "$LOG_PREFIX ❌ Integridad de la BD FALLIDA."
        return 1
    fi
}

# --- Verificación inicial ---
echo "$LOG_PREFIX --- INICIO ---"
ls -lh "/var/lib/sqlite/" | grep -v "init_db.sh"  # Muestra solo archivos relevantes

# Si la BD no existe o está corrupta, crearla
if [ ! -f "$DB_PATH" ] || ! sqlite3 "$DB_PATH" "SELECT 1;" >/dev/null 2>&1 || verify_db; then
    echo "$LOG_PREFIX  Creando nueva BD..."
    rm -f "$DB_PATH"
    sqlite3 "$DB_PATH" < "$INIT_SCRIPT" || exit 1
    echo "$LOG_PREFIX ✅ BD creada!"
    list_tables  # <-- Mostrar tablas nuevas
else
    echo "$LOG_PREFIX ✔️ BD existente."
    list_tables  # <-- Mostrar tablas actuales
    verify_db # verificar integridad de la base de datos existente.
fi

# Mantener contenedor activo
echo "$LOG_PREFIX --- CONTENEDOR ACTIVO ---"
exec tail -f /dev/null