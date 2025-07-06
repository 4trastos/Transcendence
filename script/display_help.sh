#!/bin/bash

# display_help.sh - Muestra el menú de ayuda con título centrado y contenido alineado a la izquierda

# Configuración de colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Función para centrar texto
center_text() {
    local text="$1"
    local term_width=$(tput cols)
    local padding=$(( (term_width - ${#text}) / 2 ))
    printf "%${padding}s" ""
    echo -e "$text"
}

# Función para texto alineado a izquierda con sangría
display_menu_item() {
    local num=$1
    local cmd=$2
    local desc=$3
    local color=$4
    
    # Formato con sangría de 4 espacios
    printf "    ${color}%2s. ${BOLD}%-25s${NC} - %s\n" "$num" "$cmd" "$desc"
}

# Limpiar pantalla
clear

# Obtener dimensiones de terminal
term_height=$(tput lines)
term_width=$(tput cols)


# Calcular padding vertical (espacio arriba)
help_lines=19 # Número de líneas de ayuda
padding=$(( (term_height - help_lines - 7) / 2 )) # 7 líneas del título

# Añadir espacios vacíos para centrar verticalmente
for ((i=1; i<=padding; i++)); do
    echo ""
done

# Arte ASCII con cada línea centrada individualmente
center_text "${CYAN} █████   █████ ██████████ █████       ███████████  ███${NC}"
center_text "${CYAN}░░███   ░░███ ░░███░░░░░█░░███       ░░███░░░░░███░███${NC}"
center_text "${CYAN} ░███    ░███  ░███  █ ░  ░███        ░███    ░███░███${NC}"
center_text "${CYAN} ░███████████  ░██████    ░███        ░██████████ ░███${NC}"
center_text "${CYAN} ░███░░░░░███  ░███░░█    ░███        ░███░░░░░░  ░███${NC}"
center_text "${CYAN} ░███    ░███  ░███ ░   █ ░███      █ ░███        ░░░ ${NC}"
center_text "${CYAN} █████   █████ ██████████ ███████████ █████        ███${NC}"
center_text "${CYAN}░░░░░   ░░░░░ ░░░░░░░░░░ ░░░░░░░░░░░ ░░░░░        ░░░ ${NC}"
center_text " "
center_text " "
center_text " "

# Mostrar título del menú centrado
center_text "${BOLD}${YELLOW}        MENÚ DE AYUDA - COMANDOS DISPONIBLES${NC}"
center_text "${BLUE}════════════════════════════════════════════${NC}"
center_text " "

# Mostrar items del menú alineados a izquierda con sangría
display_menu_item "1" "make" "Reinicia Docker si es necesario y construye los contenedores" "$GREEN"
display_menu_item "2" "make kill_docker" "Detiene Docker y reinicia la aplicación" "$GREEN"
display_menu_item "3" "make restart_if_needed" "Reinicia Docker solo si es necesario" "$GREEN"
display_menu_item "4" "make down" "Detiene y elimina contenedores" "$GREEN"
display_menu_item "5" "make clean" "Elimina datos, contenedores, imágenes, volúmenes y redes" "$GREEN"
display_menu_item "6" "make setup" "Crea los directorios necesarios" "$GREEN"
display_menu_item "7" "make re" "Detiene todo y lo reinicia (down + all)" "$GREEN"
display_menu_item "8" "make delete" "Elimina volúmenes Docker relacionados y limpia recursos" "$GREEN"
display_menu_item "9" "make ps" "Muestra el estado de los contenedores" "$GREEN"
display_menu_item "10" "make logs" "Muestra logs para todos los servicios" "$GREEN"
display_menu_item "11" "make logs_service" "Muestra logs para un servicio específico" "$GREEN"
display_menu_item "12" "make scan" "Ejecuta escaneo de seguridad ZAP" "$GREEN"
display_menu_item "13" "make security" "Ejecuta escaneos de seguridad completos" "$GREEN"
display_menu_item "14" "make token" "Muestra credenciales de Vault" "$GREEN"
display_menu_item "15" "make verify user=<user>" "Verifica la cuenta de un usuario" "$GREEN"
display_menu_item "16" "make jwt" "Generador/validador de tokens JWT" "$GREEN"
display_menu_item "17" "make 2fa" "Verifica que 2FA está funcionando y sincronizado con Google Authenticator" "$GREEN"
display_menu_item "19" "make email" "Verifica que el servicio de email está implementado y es funcional" "$GREEN"
display_menu_item "20" "make elastic-password" "Muestra el password para poder acceder a Elasticsearch" "$GREEN"
display_menu_item "21" "make grafana" "Muestra el password para poder acceder a Grafana" "$GREEN"
display_menu_item "22" "make prometheus" "Muestra el password para poder acceder a Prometheus" "$GREEN"

center_text " "

# Añadir espacios vacíos al final si es necesario
remaining=$(( term_height - padding - help_lines - 7 - 2 ))
for ((i=1; i<=remaining; i++)); do
    echo ""
done