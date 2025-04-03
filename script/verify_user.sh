#!/bin/bash
user="$1"

# Función para mostrar errores (exit 1)
show_error() {
    echo "Error: $1" >&2
    exit 1
}

# Función para mensajes informativos (exit 0)
show_info() {
    echo "Info: $1"
    exit 0
}

# Verificar conexión con BD
if ! docker exec sqlite sqlite3 --version >/dev/null 2>&1; then
    show_error "El contenedor 'sqlite' no está accesible"
fi

# Caso 1: Sin argumentos - Mostrar usuarios verificados y no verificados
if [ -z "$user" ]; then
    echo "Usuarios verificados:"
    echo "-------------------"
    
    verified_users=$(docker exec sqlite sqlite3 sqlite.db \
        "SELECT username FROM users WHERE is_verified = 1;" 2>/dev/null)
    
    if [ -z "$verified_users" ]; then
        echo "No hay usuarios verificados en la base de datos."
    else
        echo "$verified_users"
    fi

    echo ""
    echo "Usuarios no verificados:"
    echo "------------------------"
    
    unverified_users=$(docker exec sqlite sqlite3 sqlite.db \
        "SELECT username FROM users WHERE is_verified = 0 OR is_verified IS NULL;" 2>/dev/null)
    
    if [ -z "$unverified_users" ]; then
        echo "No hay usuarios no verificados en la base de datos."
    else
        echo "$unverified_users"
    fi
    
    echo ""
    show_info "Para verificar un usuario, ejecuta: make verify user=nombre_usuario"
fi

# Consulta segura para verificar existencia del usuario
result=$(docker exec sqlite sqlite3 sqlite.db \
    "SELECT username, is_verified FROM users WHERE username = '$user';" 2>/dev/null)

# Caso 2: Usuario no existe
if [ -z "$result" ]; then
    show_error "El usuario '$user' no existe en la base de datos."
fi

# Caso 3: Usuario existe
echo "Actualizando verificación para '$user'..."
docker exec sqlite sqlite3 sqlite.db \
    "UPDATE users SET is_verified = 1 WHERE username = '$user';"

echo "Estado actual:"
docker exec sqlite sqlite3 sqlite.db \
    "SELECT username, is_verified, datetime('now') as verified_at 
     FROM users WHERE username = '$user';"