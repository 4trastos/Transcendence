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
#JWT_SECRET="a-string-secret-at-least-256-bits-long"
API_URL="https://localhost:8443/backend/api"

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
    echo -e -n "${BLUE} Introduce la contraseña: ${NC}"
    read -s password
    echo ""
}

# Generar y verificar token
parse_json() {
    local json="$1"
    local key="$2"
    
    # Extraer valor usando awk (método robusto sin jq)
    echo "$json" | awk -F"\"$key\":" '{print $2}' | awk -F'"' '{print $2}'
}

jwt_process() {
    check_dependencies
    
    if ! show_available_users; then
        show_info "Usa 'make verify user=nombre_usuario' para verificar usuarios primero."
        exit 1
    fi
    
    echo -e -n "${BLUE} Introduce el usuario: ${NC}"
    read username
    check_user "$username"
    
    read_password
    
    echo -e "\n${CYAN}️ Generando token para $username...${NC}"
    
    # Usar archivo temporal para capturar respuesta
    temp_file=$(mktemp)
    http_code=$(curl -k -s -o "$temp_file" -w "%{http_code}" \
        -X POST "$API_URL/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}")
    
    # Verificar código HTTP
    if [ "$http_code" != "200" ]; then
        error_msg=$(cat "$temp_file")
        show_error "Error HTTP $http_code: $error_msg"
    fi
    
    response=$(cat "$temp_file")
    rm -f "$temp_file"
    
    # Extraer token con método nativo
    token=$(parse_json "$response" "token")
    
    # Después de recibir la respuesta que requiere 2FA
    if [[ "$response" == *"requires2FA"* ]]; then
        tempToken=$(parse_json "$response" "tempToken")
        userId=$(parse_json "$response" "userId")
        
        echo -e "${YELLOW}⚠️ Se requiere verificación 2FA${NC}"
        
        # Obtener secreto actual de la base de datos
        secret=$(docker exec sqlite sqlite3 /var/lib/sqlite/sqlite.db \
            "SELECT two_factor_secret FROM users WHERE id = $userId;")
        
        echo -e "${CYAN} Secreto 2FA del usuario: ${MAGENTA}$secret${NC}"
        
        # Generar código actual
        current_code=$(docker exec app node -e \
            "console.log(require('speakeasy').totp({secret: '$secret', encoding: 'base32'}))")
        
        echo -e "${CYAN} Código generado actualmente: ${MAGENTA}$current_code${NC}"
        
        # Solicitar código al usuario
        echo -e -n "${BLUE} Introduce el código 2FA: ${NC}"
        read code2fa
        
        # Enviar verificación 2FA con timeout
        temp_file=$(mktemp)
        http_code=$(curl -k -m 30 -s -o "$temp_file" -w "%{http_code}" \
            -X POST "$API_URL/verify-2fa" \
            -H "Content-Type: application/json" \
            -d "{\"userId\":\"$userId\", \"code\":\"$code2fa\", \"tempToken\":\"$tempToken\"}")
        
        response=$(cat "$temp_file")
        rm -f "$temp_file"
        
        if [[ "$http_code" != "200" ]]; then
            error_msg=$(parse_json "$response" "error" || echo "Respuesta inesperada")
            show_error "Error HTTP $http_code en verificación 2FA: $error_msg"
        fi
        
        token=$(parse_json "$response" "accessToken")
    fi
    
    if [ -z "$token" ]; then
        error_msg=$(parse_json "$response" "error" || echo "Respuesta inesperada")
        show_error "Error al obtener token: $error_msg"
    fi
    
    echo -e "\n${GREEN} Respuesta del servidor:${NC}"
    echo -e "${MAGENTA}-----------------------${NC}"
    echo "$response"
    
    echo -e "\n${GREEN} Token generado:${NC}"
    echo -e "${MAGENTA}---------------${NC}"
    echo "$token"

    # Menú simplificado con solo dos opciones
    while true; do
        echo -e "\n${BLUE}¿Qué deseas hacer ahora?${NC}"
        echo "1) Copiar_token_para_jwt.io"
        echo "2) Salir"
        read -p "#? " choice

        case $choice in
            1)
                # Mostrar instrucciones para jwt.io
                echo -e "\n${CYAN}Visita: https://jwt.io"
                echo -e "Pega este token en la página para verificar su contenido:${NC}"
                echo -e "${MAGENTA}$token${NC}"
                ;;
            2)
                echo -e "\n${GREEN} ¡Hasta pronto!${NC}\n"
                exit 0
                ;;
            *)
                echo -e "\n${RED}⚠️ Opción no válida${NC}"
                ;;
        esac
    done
}

# Función para administradores - verificar usuarios
admin_verify_user() {
    local user="$1"
    check_db_connection
    
    if [ -z "$user" ]; then
        # Modo administrador - mostrar todos los usuarios
        echo -e "\n${CYAN} Estado de verificación de usuarios:${NC}"
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
    
    echo -e "\n${CYAN} Actualizando verificación para '$user'...${NC}"
    docker exec sqlite sqlite3 sqlite.db \
        "UPDATE users SET is_verified = 1 WHERE username = '$user';"
    
    echo -e "\n${GREEN} Estado actual:${NC}"
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
        echo -e "${BLUE} Uso: $0 {verify [usuario]|jwt}${NC}"
        exit 1
esac