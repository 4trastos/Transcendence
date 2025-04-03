#!/bin/bash

# Configuración de colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
JWT_SECRET="tu_super_secreto_complejo_aqui"
API_URL="http://localhost:3000/api"

# Función para mostrar errores
show_error() {
    echo -e "❌ ${RED}Error: $1${NC}" >&2
    exit 1
}

# Función para mostrar información
show_info() {
    echo -e "ℹ️ ${YELLOW}Info: $1${NC}"
}

# Función para mostrar éxito
show_success() {
    echo -e "✅ ${GREEN}$1${NC}"
}

# Verificar dependencias
check_dependencies() {
    if ! command -v curl >/dev/null; then
        show_error "curl no está instalado. Por favor instálalo primero."
    fi
    
    if ! command -v docker >/dev/null; then
        show_error "Docker no está instalado o no está corriendo."
    fi
}

# Verificar conexión con BD
check_db_connection() {
    if ! docker exec sqlite sqlite3 --version >/dev/null 2>&1; then
        show_error "El contenedor 'sqlite' no está accesible"
    fi
}

# Mostrar usuarios verificados (disponibles)
show_available_users() {
    check_db_connection
    
    verified_users=$(docker exec sqlite sqlite3 sqlite.db \
        "SELECT username FROM users WHERE is_verified = 1;" 2>/dev/null)
    
    if [ -z "$verified_users" ]; then
        show_info "No hay usuarios verificados disponibles."
        return 1
    else
        echo -e "\n${CYAN}Usuarios disponibles:${NC}"
        echo -e "${MAGENTA}---------------------${NC}"
        echo "$verified_users" | awk '{print "  " $0}'
        echo ""
        return 0
    fi
}

# Verificar si un usuario existe y está verificado
check_user() {
    local user="$1"
    check_db_connection
    
    result=$(docker exec sqlite sqlite3 sqlite.db \
        "SELECT username, is_verified FROM users WHERE username = '$user';" 2>/dev/null)
    
    if [ -z "$result" ]; then
        show_error "El usuario '$user' no existe en la base de datos."
    fi
    
    is_verified=$(echo "$result" | awk -F'|' '{print $2}')
    if [ "$is_verified" != "1" ]; then
        show_error "El usuario '$user' no está verificado. Usa: make verify user=$user"
    fi
}

# Función para leer contraseña sin mostrarla
read_password() {
    echo -e -n "${BLUE}🔑 Introduce la contraseña: ${NC}"
    read -s password
    echo ""
}

# Función para verificar el token
verify_token_with_curl() {
    local token=$1
    echo -e "\n${CYAN}🔍 Verificando token a través del endpoint /api/validate...${NC}"
    
    response=$(curl -s -X POST "$API_URL/validate-token" \
        -H "Content-Type: application/json" \
        -d "{\"token\":\"$token\"}")
    
    echo -e "\n${GREEN}📊 Resultado de la verificación:${NC}"
    echo -e "${MAGENTA}----------------------------${NC}"
    echo "$response" | python -m json.tool 2>/dev/null || echo "$response"
}

# Generar y verificar token
jwt_process() {
    check_dependencies
    
    if ! show_available_users; then
        show_info "Usa 'make verify user=nombre_usuario' para verificar usuarios primero."
        exit 1
    fi
    
    echo -e -n "${BLUE}👤 Introduce el usuario: ${NC}"
    read username
    check_user "$username"
    
    read_password
    
    # Generar token
    echo -e "\n${CYAN}🛠️ Generando token para $username...${NC}"
    response=$(curl -s -X POST "$API_URL/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}")
    
    echo -e "\n${GREEN}📨 Respuesta del servidor:${NC}"
    echo -e "${MAGENTA}-----------------------${NC}"
    echo "$response"
    echo ""
    
    # Extraer token
    token=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        show_error "Error al obtener el token"
    fi
    
    # Mostrar token claramente
    echo -e "${GREEN}🔐 Token generado:${NC}"
    echo -e "${MAGENTA}---------------${NC}"
    echo "$token"
    echo ""
    
    # Preguntar qué hacer a continuación
    while true; do
        echo -e "${BLUE}¿Qué deseas hacer ahora?${NC}"
        options=("Verificar_token" "Hacer_petición_protegida" "Salir")
        select opt in "${options[@]}"; do
            case $REPLY in
                1)
                    verify_token_with_curl "$token"
                    break
                    ;;
                2)
                    echo -e "\n${CYAN}🛡️ Realizando petición protegida...${NC}"
                    response=$(curl -s "$API_URL/protected-test" \
                        -H "Authorization: Bearer $token")
                    
                    echo -e "\n${GREEN}📡 Respuesta protegida:${NC}"
                    echo -e "${MAGENTA}--------------------${NC}"
                    echo "$response" | python -m json.tool 2>/dev/null || echo "$response"
                    break
                    ;;
                3)
                    echo -e "\n${GREEN}👋 ¡Hasta pronto!${NC}\n"
                    exit 0
                    ;;
                *)
                    echo -e "\n${RED}⚠️ Opción no válida${NC}"
                    ;;
            esac
        done
    done
}

# Función para administradores - verificar usuarios
admin_verify_user() {
    local user="$1"
    check_db_connection
    
    if [ -z "$user" ]; then
        # Modo administrador - mostrar todos los usuarios
        echo -e "\n${CYAN}📊 Estado de verificación de usuarios:${NC}"
        echo -e "${MAGENTA}----------------------------------${NC}"
        docker exec sqlite sqlite3 sqlite.db \
            "SELECT username, 
             CASE WHEN is_verified = 1 THEN '✅ VERIFICADO' 
             ELSE '❌ NO VERIFICADO' END as status 
             FROM users;" | column -t -s "|"
        
        echo ""
        show_info "Para verificar un usuario: make verify user=nombre_usuario"
        return
    fi
    
    # Verificar usuario específico
    result=$(docker exec sqlite sqlite3 sqlite.db \
        "SELECT username FROM users WHERE username = '$user';" 2>/dev/null)
    
    if [ -z "$result" ]; then
        show_error "El usuario '$user' no existe en la base de datos."
    fi
    
    echo -e "\n${CYAN}🔄 Actualizando verificación para '$user'...${NC}"
    docker exec sqlite sqlite3 sqlite.db \
        "UPDATE users SET is_verified = 1 WHERE username = '$user';"
    
    echo -e "\n${GREEN}📈 Estado actual:${NC}"
    docker exec sqlite sqlite3 sqlite.db \
        "SELECT username, is_verified, datetime('now') as verified_at 
         FROM users WHERE username = '$user';"
}

# Menú principal
case "$1" in
    verify)
        admin_verify_user "$2"
        ;;
    jwt)
        jwt_process
        ;;
    *)
        echo -e "${BLUE}📝 Uso: $0 {verify [usuario]|jwt}${NC}"
        exit 1
esac