#!/bin/bash

URL="http://localhost:8081/"

check_url_ready() {
  RESPONSE=$(curl -s "$URL")
  if [[ "$RESPONSE" == *"<title>ZAP API UI</title>"* ]]; then
    return 0
  else
    return 1
  fi
}

# Función para centrar texto en la terminal
center_text() {
  local text="$1"
  local cols=$(tput cols)
  local padding=$(( (cols - ${#text}) / 2 ))
  printf "%*s%s\n" "$padding" "" "$text"
}

loading_bar() {
  local progress=0
  local bar_length=80
  local rows=$(tput lines)
  local center_row=$((rows / 2))  # Posición vertical centrada

  tput civis  # Ocultar cursor para una mejor experiencia
  tput cup $center_row 0
  center_text "🚀 Initializing services... Please wait! 🚀"
  
  while ! check_url_ready; do
    tput sc  # Guardar posición del cursor

    # Barra de carga centrada
    local bar="["
    for ((i = 0; i < bar_length; i++)); do
      if [ $i -lt $progress ]; then
        bar+="█"
      else
        bar+="-"
      fi
    done
    bar+="]"

    tput cup $((center_row + 2)) 0  # Mover el cursor donde debe ir la barra
    center_text "$bar"

    tput rc  # Restaurar cursor a la posición guardada
    progress=$(( (progress + 1) % (bar_length + 1) ))
    sleep 0.9
  done
  tput cnorm  # Restaurar cursor
}

url_ready() {
  clear
  local rows=$(tput lines)
  local center_row=$((rows / 2))  
  tput cup $center_row 0  
  center_text "✅ ALL SERVICES are available! - ENJOY THE EXPERIENCE ✅"
  sleep 2
}

loading_bar
url_ready
