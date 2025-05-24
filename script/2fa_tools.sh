#!/bin/bash

# Configuración de colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

user="$1"

# Función para mostrar errores (exit 1)
show_error() {
    echo -e "❌ ${RED}Error: $1${NC}" >&2
    exit 1
}

# Función para mensajes informativos (exit 0)
show_info() {
    echo -e "ℹ️ ${YELLOW}$1${NC}"
    exit 0
}

# Función para mostrar detalles de usuario
show_user_details() {
    local user="$1"
    echo -e "\n${CYAN}📝 Detalles completos del usuario '$user':${NC}"
    echo -e "${MAGENTA}----------------------------------------${NC}"
    
    # Obtener todos los datos del usuario
    user_data=$(docker exec sqlite sqlite3 /var/lib/sqlite/sqlite.db \
        "SELECT * FROM users WHERE username = '$user';" 2>/dev/null | tr '|' '\n')
    
    # Mapear campos a nombres legibles usando arrays indexados
    fields=("ID" "Username" "Email" "" "Fecha Creación" "Fecha Actualización" "" "Verificado" "Activo" "Verification Token" "Avatar URL" "Secreto 2FA" "2FA Habilitado")
    
    counter=1
    while read -r line; do
        if [ -n "${fields[$((counter - 1))]}" ]; then
            echo -e "${BLUE}${fields[$((counter - 1))]}:${NC} $line"
        fi
        ((counter++))
    done <<< "$user_data"
}

# Función para mostrar tokens JWT
show_jwt_tokens() {
    local user_id="$1"
    echo -e "\n${CYAN}🔑 Tokens JWT asociados:${NC}"
    echo -e "${MAGENTA}------------------------${NC}"
    
    # Mostrar refresh tokens
    refresh_tokens=$(docker exec sqlite sqlite3 /var/lib/sqlite/sqlite.db \
        "SELECT token, expires_at FROM refresh_tokens WHERE user_id = $user_id;" 2>/dev/null)
    
    if [ -n "$refresh_tokens" ]; then
        echo -e "${GREEN}Refresh Tokens:${NC}"
        echo "$refresh_tokens" | awk -F'|' '{print "  Token: " $1 "\n  Expira: " $2 "\n"}'
    else
        echo -e "${YELLOW}No hay refresh tokens registrados${NC}"
    fi
    
    # Mostrar tokens temporales 2FA
    temp_tokens=$(docker exec sqlite sqlite3 /var/lib/sqlite/sqlite.db \
        "SELECT token, expires_at FROM two_fa_tokens WHERE user_id = $user_id;" 2>/dev/null)
    
    if [ -n "$temp_tokens" ]; then
        echo -e "${GREEN}Tokens Temporales 2FA:${NC}"
        echo "$temp_tokens" | awk -F'|' '{print "  Token: " $1 "\n  Expira: " $2 "\n"}'
    else
        echo -e "${YELLOW}No hay tokens temporales 2FA activos${NC}"
    fi
}

# Verificar conexión con BD
if ! docker exec sqlite sqlite3 --version >/dev/null 2>&1; then
    show_error "El contenedor 'sqlite' no está accesible"
fi

# Mostrar usuarios verificados y no verificados si no se proporciona usuario
if [ -z "$user" ]; then
    echo -e "${CYAN}Usuarios verificados:${NC}"
    echo -e "${MAGENTA}-------------------${NC}"
    
    verified_users=$(docker exec sqlite sqlite3 /var/lib/sqlite/sqlite.db \
        "SELECT username, datetime(created_at) as created FROM users WHERE is_verified = 1;" 2>/dev/null)
    
    if [ -z "$verified_users" ]; then
        echo -e "${YELLOW}No hay usuarios verificados en la base de datos.${NC}"
    else
        echo "$verified_users" | awk -F'|' '{printf "  %-15s (Creado: %s)\n", $1, $2}'
    fi

    echo -e "\n${CYAN}Usuarios no verificados:${NC}"
    echo -e "${MAGENTA}------------------------${NC}"
    
    unverified_users=$(docker exec sqlite sqlite3 /var/lib/sqlite/sqlite.db \
        "SELECT username, datetime(created_at) as created FROM users WHERE is_verified = 0 OR is_verified IS NULL;" 2>/dev/null)
    
    if [ -z "$unverified_users" ]; then
        echo -e "${YELLOW}No hay usuarios no verificados en la base de datos.${NC}"
    else
        echo "$unverified_users" | awk -F'|' '{printf "  %-15s (Creado: %s)\n", $1, $2}'
    fi
    
    echo ""
    read -p "Introduce el nombre de usuario para verificar 2FA (o presiona Enter para salir): " user
    if [ -z "$user" ]; then
        show_info "Para verificar 2FA de un usuario, ejecuta: make 2fa user=nombre_usuario"
    fi
fi

# Consulta segura para verificar existencia del usuario
result=$(docker exec sqlite sqlite3 /var/lib/sqlite/sqlite.db \
    "SELECT id, username, two_factor_secret, datetime(created_at) FROM users WHERE username = '$user';" 2>/dev/null)

# Caso 2: Usuario no existe
if [ -z "$result" ]; then
    show_error "El usuario '$user' no existe en la base de datos o no tiene 2FA habilitado."
fi

# Extraer datos del usuario
user_id=$(echo "$result" | cut -d'|' -f1)
username=$(echo "$result" | cut -d'|' -f2)
secret=$(echo "$result" | cut -d'|' -f3)
created_at=$(echo "$result" | cut -d'|' -f4)

# Mostrar información completa del usuario
show_user_details "$user"
show_jwt_tokens "$user_id"

# Ejecutar comandos de verificación 2FA
echo -e "\n${CYAN}🔐 Verificando 2FA para el usuario: $user${NC}"
echo -e "${MAGENTA}-------------------------------------${NC}"
echo -e "${BLUE}Secreto 2FA:${NC} $secret"
echo -e "${BLUE}Fecha creación:${NC} $created_at"
echo ""

# Generar códigos TOTP
echo -e "${GREEN}Generando códigos de verificación:${NC}"
docker exec app node -e "
const speakeasy = require('speakeasy');
const secret = '$secret';
const currentCode = speakeasy.totp({secret, encoding:'base32'});
const nextCode = speakeasy.totp({secret, encoding:'base32', time: Math.floor(Date.now()/1000)+30});
const time = new Date();

console.log('Código actual:', currentCode);
console.log('Próximo código:', nextCode);
console.log('Hora servidor:', time.toISOString());
console.log('Validez:', '30 segundos por código');
console.log('Almacenado en:', 'users.two_factor_secret');
"

# Verificar código
echo ""
read -p "Introduce el código de verificación para probar: " code
echo ""

echo -e "${GREEN}Verificando código '$code':${NC}"
docker exec app node -e "
const speakeasy = require('speakeasy');
const secret = '$secret';
const code = '$code';
const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 6,
    time: Math.floor(Date.now()/1000)
});
console.log('Resultado:', {
    code,
    verified,
    currentTime: new Date().toISOString(),
    expectedCode: speakeasy.totp({secret, encoding:'base32'}),
    secretUsed: secret,
    verificationMethod: 'TOTP (Time-based One-Time Password)'
});
"

show_info "Verificación 2FA completada para el usuario $user"