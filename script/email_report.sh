#!/bin/bash

# Configuración mejorada
REPORT_DIR="${PWD}/reports"
REPORT_FILE="${REPORT_DIR}/email_report.html"
ERROR_FILE="${REPORT_DIR}/email_errors.txt"
CURRENT_DATE=$(date +"%d/%m/%Y a las %H:%M:%S")

# Verificar y crear directorios
mkdir -p "$REPORT_DIR" || {
  echo "Error: No se pudo crear el directorio de reportes $REPORT_DIR"
  exit 1
}

# Inicializar archivos
echo "Informe Técnico de Conectividad SMTP - $CURRENT_DATE" > "$ERROR_FILE"
echo "====================================================" >> "$ERROR_FILE"
echo "" >> "$ERROR_FILE"

# Función para verificar dependencias
check_dependencies() {
  local dependencies=("docker" "ping" "nc" "nslookup" "sed" "awk" "grep")
  for cmd in "${dependencies[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      echo "Error: $cmd no está instalado" >> "$ERROR_FILE"
      exit 1
    fi
  done
}

# Verificar dependencias
check_dependencies

# Función para ejecutar y capturar resultado con máximo detalle
run_test() {
  local name="$1"
  local command="$2"
  local success_pattern="$3"

  echo "Ejecutando prueba: $name"
  echo "Comando completo: $command" >> "$ERROR_FILE"
  
  # Capturar salida estándar y de error, además del código de salida
  output=$(eval "$command" 2>&1)
  local exit_code=$?
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")

  {
    echo "=== $name ==="
    echo "Hora de ejecución: $timestamp"
    echo "Código de salida: $exit_code"
    echo "Salida completa:"
    echo "$output"
    echo ""
    echo "Análisis técnico:"
  } >> "$ERROR_FILE"

  if [[ $exit_code -eq 0 ]] && [[ "$output" =~ $success_pattern ]]; then
    echo "    [✅] Éxito"
    echo "Resultado: PRUEBA EXITOSA" >> "$ERROR_FILE"
    return 0
  else
    echo "    [❌] Fallo (Código: $exit_code)"
    echo "Resultado: PRUEBA FALLIDA" >> "$ERROR_FILE"
    
    # Análisis técnico específico para cada tipo de prueba
    case "$name" in
      "Logs del Mailserver")
        analyze_mailserver_failure "$output" >> "$ERROR_FILE"
        ;;
      "Ping Mailserver")
        analyze_ping_failure "$output" >> "$ERROR_FILE"
        ;;
      "NSLookup Mailserver")
        analyze_nslookup_failure "$output" >> "$ERROR_FILE"
        ;;
      "Netcat Mailserver Puerto 25")
        analyze_netcat_failure "$output" >> "$ERROR_FILE"
        ;;
    esac
    
    echo "" >> "$ERROR_FILE"
    return 1
  fi
}

# Funciones de análisis técnico especializado
analyze_mailserver_failure() {
  local output="$1"
  
  echo "----- Análisis Detallado -----"
  echo "1. Búsqueda de errores críticos:"
  
  if [[ "$output" =~ "permanently deferred" ]]; then
    local rejection_reason=$(echo "$output" | sed -n 's/.*SMTP error: \(.*\)/\1/p' || echo "Razón no especificada")
    echo " - ERROR CRÍTICO: Correo rechazado permanentemente"
    echo " - Razón técnica: $rejection_reason"
    
    # Análisis de códigos de error SMTP
    if [[ "$rejection_reason" =~ "553" ]]; then
      echo " - Problema identificado: Código 553 - Rechazo por política de seguridad"
      echo " - Solución sugerida: Verificar la reputación de la IP y configurar correctamente SPF/DKIM/DMARC"
    elif [[ "$rejection_reason" =~ "554" ]]; then
      echo " - Problema identificado: Código 554 - Rechazo por spam"
      echo " - Solución sugerida: Revisar el contenido del mensaje y la lista negra de IPs"
    fi
  fi
  
  # Análisis de conexión TLS
  if [[ "$output" =~ "TLS handshake failed" ]]; then
    echo " - ERROR TLS: Fallo en el protocolo de seguridad"
    echo " - Razón posible: Certificado SSL inválido o no soportado"
  fi
  
  # Búsqueda de warnings
  echo ""
  echo "2. Advertencias detectadas:"
  echo "$output" | grep -i "warning" | head -n 5 | sed 's/^/ - /'
}

analyze_ping_failure() {
  local output="$1"
  
  echo "----- Análisis de Conectividad ICMP -----"
  echo "Estadísticas de ping:"
  echo "$output" | tail -n 2
  
  if [[ "$output" =~ "100% packet loss" ]]; then
    echo " - Problema: Pérdida total de paquetes"
    echo " - Causas posibles:"
    echo "    * Firewall bloqueando ICMP"
    echo "    * Servidor no disponible"
    echo "    * Problemas de ruteo"
  elif [[ "$output" =~ "Name or service not known" ]]; then
    echo " - Problema: Nombre de host no resuelto"
    echo " - Verificar: Configuración DNS y /etc/hosts"
  fi
}

analyze_nslookup_failure() {
  local output="$1"
  
  echo "----- Análisis de Resolución DNS -----"
  if [[ "$output" =~ "NXDOMAIN" ]]; then
    echo " - Error: Dominio no existe (NXDOMAIN)"
    echo " - Verificar: Registro DNS del dominio"
  elif [[ "$output" =~ "SERVFAIL" ]]; then
    echo " - Error: Fallo en el servidor DNS (SERVFAIL)"
    echo " - Verificar: Servidores DNS configurados"
  else
    echo " - Respuesta DNS completa:"
    echo "$output"
  fi
}

analyze_netcat_failure() {
  local output="$1"
  
  echo "----- Análisis de Conexión SMTP -----"
  if [[ "$output" =~ "Connection refused" ]]; then
    echo " - Error: Conexión rechazada"
    echo " - Causas posibles:"
    echo "    * Servicio SMTP no está corriendo"
    echo "    * Firewall bloqueando el puerto 25"
    echo "    * Servidor configurado en otro puerto"
  elif [[ "$output" =~ "No route to host" ]]; then
    echo " - Error: No hay ruta al host"
    echo " - Problema de conectividad de red"
  else
    echo " - Salida completa:"
    echo "$output"
  fi
}

# Función mejorada para analizar logs del mailserver
analyze_mailserver_logs() {
  local mailserver_status="unknown"
  local log_output=""
  
  if docker ps | grep -q mailserver; then
    log_output=$(docker logs mailserver 2>&1 | tail -n 50)  # Últimas 50 líneas para análisis
    
    if [[ "$log_output" =~ "permanently deferred" ]]; then
      mailserver_status="failed"
      local rejection_reason=$(echo "$log_output" | sed -n 's/.*SMTP error: \(.*\)/\1/p' || echo "Razón no especificada")
      
      # Análisis detallado del rechazo
      local smtp_code=$(echo "$rejection_reason" | grep -oE '^[0-9]{3}')
      local detailed_analysis=""
      
      case "$smtp_code" in
        "553") detailed_analysis="Rechazo por política del servidor remoto. Posible problema de reputación o configuración SPF/DKIM." ;;
        "554") detailed_analysis="Rechazado como spam. Verificar contenido y listas negras." ;;
        "550") detailed_analysis="Mailbox no disponible o rechazado por el servidor destino." ;;
        *) detailed_analysis="Rechazo genérico. Ver logs completos." ;;
      esac
      
      add_test_result "Logs del Mailserver" "failed" "✗ Correo rechazado (Código $smtp_code)" \
        "Motivo técnico: $rejection_reason\n\nAnálisis detallado:\n$detailed_analysis\n\nÚltimos logs:\n$log_output"
      
    elif [[ "$log_output" =~ "Completed" ]]; then
      mailserver_status="passed"
      MAIL_DELIVERY_OPERATIONAL="Operacional"
      
      # Extraer detalles de la entrega exitosa
      local delivery_details=$(echo "$log_output" | grep -A5 "Completed" | head -n 5)
      add_test_result "Logs del Mailserver" "passed" "✓ Correo entregado" \
        "El correo se envió correctamente.\n\nDetalles de entrega:\n$delivery_details\n\nConexión TLS establecida: $(echo "$log_output" | grep -q "TLS" && echo "Sí" || echo "No")"
    else
      mailserver_status="failed"
      add_test_result "Logs del Mailserver" "failed" "✗ Estado desconocido" \
        "No se pudo determinar el estado del envío.\n\nLogs disponibles:\n$log_output\n\nPosibles causas:\n- El servidor no ha procesado ningún correo\n- Configuración incorrecta\n- Problema de autenticación"
    fi
  else
    add_test_result "Logs del Mailserver" "failed" "✗ Contenedor no disponible" \
      "El contenedor mailserver no está corriendo.\n\nAcciones requeridas:\n- Iniciar el contenedor\n- Verificar logs de Docker\n- Revisar configuración del servicio"
    mailserver_status="failed"
  fi
  
  return $([ "$mailserver_status" == "passed" ])
}

# Contadores de pruebas
TOTAL_TESTS=0
PASSED_TESTS=0

# Variables para el estado de los servicios
SMTP_SERVICE_ACTIVE="Inactivo"
MAIL_DELIVERY_OPERATIONAL="Con problemas"

# Función mejorada para añadir resultados al reporte
add_test_result() {
  local test_name="$1"
  local status="$2"  # "passed" o "failed"
  local description="$3"
  local details="$4"

  ((TOTAL_TESTS++))
  [[ $status == "passed" ]] && ((PASSED_TESTS++))

  local test_class="test-box"
  if [[ "$status" == "passed" ]]; then
    test_class+=" passed"
  elif [[ "$status" == "failed" ]]; then
    test_class+=" failed"
  fi

  # Explicaciones detalladas para cada tipo de prueba
  local explanation=""
  case "$test_name" in
    "Logs del Mailserver")
      explanation="<div class='tech-info'><strong>Técnica:</strong> Análisis de logs del demonio SMTP (Exim/Postfix)."
      explanation+="<br><strong>Comando usado:</strong> <code>docker logs mailserver</code></div>"
      
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Impacto:</strong> Los correos no se están entregando correctamente.</div>"
      test_name_display="<span style='color: #e74c3c; font-weight: bold;'>Logs del Mailserver</span>"
      ;;
    "Ping Mailserver")
      explanation="<div class='tech-info'><strong>Técnica:</strong> Prueba ICMP para verificar conectividad básica."
      explanation+="<br><strong>Comando usado:</strong> <code>docker exec app ping -c 3 mailserver</code></div>"
      
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Impacto:</strong> No hay conectividad básica con el servidor.</div>"
      test_name_display="<span style='color: #f39c12; font-weight: bold;'>Ping Mailserver</span>"
      ;;
    "NSLookup Mailserver")
      explanation="<div class='tech-info'><strong>Técnica:</strong> Resolución DNS del nombre del servidor."
      explanation+="<br><strong>Comando usado:</strong> <code>docker exec app nslookup mailserver</code></div>"
      
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Impacto:</strong> No se puede resolver el nombre del servidor.</div>"
      test_name_display="<span style='color: #9b59b6; font-weight: bold;'>NSLookup Mailserver</span>"
      ;;
    "Netcat Mailserver Puerto 25")
      explanation="<div class='tech-info'><strong>Técnica:</strong> Conexión TCP al puerto SMTP (25)."
      explanation+="<br><strong>Comando usado:</strong> <code>docker exec app nc -zv mailserver 25</code></div>"
      
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Impacto:</strong> El servicio SMTP no está disponible.</div>"
      test_name_display="<span style='color: #1abc9c; font-weight: bold;'>Netcat Mailserver Puerto 25</span>"
      ;;
    *)
      test_name_display="<span style='font-weight: bold;'>$test_name</span>"
      ;;
  esac

  # Asegurarse de que el archivo de reporte existe
  if [ ! -f "$REPORT_FILE" ]; then
    generate_report_header
  fi

  # Formatear los detalles con salto de línea HTML
  local formatted_details=$(echo "$details" | sed 's/$/<br>/')

  echo "<div class='$test_class'>" >> "$REPORT_FILE"
  echo "<h3>$test_name_display</h3>" >> "$REPORT_FILE"
  echo "<p><strong>Estado:</strong> <span class='$status'>$description</span></p>" >> "$REPORT_FILE"
  echo "<p>$explanation</p>" >> "$REPORT_FILE"
  echo "<div class='output-box'><strong>Detalles técnicos:</strong><br>$formatted_details</div>" >> "$REPORT_FILE"
  echo "</div>" >> "$REPORT_FILE"
}

# Función para generar el encabezado del reporte con más estilos
generate_report_header() {
  cat > "$REPORT_FILE" <<EOF
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe Técnico de Conectividad SMTP</title>
  <style type="text/css">
    body {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #333;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      border-radius: 5px;
    }
    
    h1 {
      text-align: center;
      font-weight: 300;
      font-size: 36px;
      color: #2c3e50;
      margin-bottom: 30px;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
    }
    
    h2 {
      font-size: 26px;
      color: #34495e;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      margin-top: 40px;
    }
    
    h3 {
      font-size: 20px;
      color: #7f8c8d;
      margin-top: 30px;
    }
    
    .test-box {
      margin: 20px 0;
      padding: 20px;
      border-radius: 5px;
      background-color: #f8f8f8;
      border-left: 5px solid #ddd;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .test-box.passed {
      border-left-color: #27ae60;
      background-color: #e8f8f0;
    }
    
    .test-box.failed {
      border-left-color: #e74c3c;
      background-color: #fdedec;
    }
    
    .test-box h3 {
      margin-top: 0;
      color: #2c3e50;
      font-size: 18px;
    }
    
    .output-box {
      background-color: white;
      padding: 15px;
      border-radius: 4px;
      border: 1px solid #ddd;
      margin-top: 15px;
      font-family: Monaco, Consolas, "Courier New", monospace;
      font-size: 13px;
      line-height: 1.5;
      overflow-x: auto;
    }
    
    .error-details {
      margin-top: 15px;
      padding: 12px;
      background-color: #ffebee;
      border-radius: 4px;
      border-left: 4px solid #f44336;
    }
    
    .tech-info {
      margin: 10px 0;
      padding: 10px;
      background-color: #e3f2fd;
      border-radius: 4px;
      font-size: 13px;
      color: #0d47a1;
    }
    
    .header-section {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .timestamp {
      color: #7f8c8d;
      font-size: 14px;
      margin-top: 5px;
    }
    
    .summary-stats {
      display: flex;
      justify-content: center;
      margin: 30px 0;
      gap: 20px;
      flex-wrap: wrap;
    }
    
    .stat-box {
      text-align: center;
      padding: 20px;
      border-radius: 5px;
      background-color: #ecf0f1;
      min-width: 150px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .stat-label {
      font-weight: bold;
      margin-bottom: 10px;
      color: #7f8c8d;
      font-size: 14px;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 300;
      color: #2c3e50;
    }
    
    .stat-box.passed {
      background-color: #27ae60;
      color: white;
    }
    
    .stat-box.passed .stat-label,
    .stat-box.passed .stat-value {
      color: white;
    }
    
    .stat-box.failed {
      background-color: #e74c3c;
      color: white;
    }
    
    .stat-box.failed .stat-label,
    .stat-box.failed .stat-value {
      color: white;
    }
    
    .summary-section {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 30px;
    }
    
    .conclusion {
      margin-top: 40px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 5px;
      border-left: 5px solid #3498db;
    }
    
    code {
      background-color: #f1f1f1;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: Monaco, Consolas, "Courier New", monospace;
      font-size: 12px;
      color: #c7254e;
    }
    
    pre {
      background-color: #2c3e50;
      color: #ecf0f1;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-family: Monaco, Consolas, "Courier New", monospace;
      font-size: 13px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-section">
      <h1>Informe Técnico de Conectividad SMTP</h1>
      <div class="timestamp">Generado el $CURRENT_DATE</div>
    </div>

    <div class="summary-section">
      <h2>Resumen Ejecutivo</h2>
      <p>Este informe técnico detalla los resultados de las pruebas de conectividad y funcionalidad del servidor de correo SMTP. Incluye análisis detallados de protocolos, resolución DNS y logs del sistema.</p>

      <div class="summary-stats">
        <div class="stat-box">
          <div class="stat-label">Pruebas Totales</div>
          <div class="stat-value" id="total-count">0</div>
        </div>
        <div class="stat-box passed">
          <div class="stat-label">Pruebas Exitosas</div>
          <div class="stat-value" id="passed-count">0</div>
        </div>
        <div class="stat-box failed">
          <div class="stat-label">Pruebas Fallidas</div>
          <div class="stat-value" id="failed-count">0</div>
        </div>
      </div>
    </div>

    <h2>Resultados Detallados</h2>
    <p>A continuación se presentan los resultados técnicos de cada prueba realizada:</p>
EOF
}

# Generar encabezado del reporte
generate_report_header

# 1. Pruebas de Conectividad
analyze_mailserver_logs

run_test "Ping Mailserver" "docker exec app ping -c 3 mailserver" "3 packets received"
if [ $? -eq 0 ]; then
  ping_output=$(docker exec app ping -c 3 mailserver)
  avg_latency=$(echo "$ping_output" | grep 'avg' | awk -F'/' '{print $5}')
  add_test_result "Ping Mailserver" "passed" "✓ Ping exitoso (0% pérdida de paquetes)" \
    "Resultado del ping:\n$ping_output\n\nAnálisis:\n- Conectividad ICMP funcionando correctamente\n- Latencia promedio: ${avg_latency} ms"
else
  add_test_result "Ping Mailserver" "failed" "✗ Ping fallido (100% pérdida de paquetes)" \
    "Resultado del ping:\n$(docker exec app ping -c 3 mailserver)\n\nPosibles causas:\n- Firewall bloqueando ICMP\n- Servidor no disponible\n- Problemas de red entre contenedores"
fi

run_test "NSLookup Mailserver" "docker exec app nslookup mailserver" "Address:"
if [ $? -eq 0 ]; then
  nslookup_output=$(docker exec app nslookup mailserver)
  resolved_ip=$(echo "$nslookup_output" | grep 'Address' | tail -n1 | awk '{print $2}')
  dns_server=$(echo "$nslookup_output" | grep 'Server' | awk '{print $2}')
  add_test_result "NSLookup Mailserver" "passed" "✓ Resolución DNS exitosa" \
    "Resultado de nslookup:\n$nslookup_output\n\nDetalles:\n- IP resuelta: $resolved_ip\n- Servidor DNS usado: $dns_server"
else
  add_test_result "NSLookup Mailserver" "failed" "✗ Fallo en resolución DNS" \
    "Resultado de nslookup:\n$(docker exec app nslookup mailserver)\n\nProblemas detectados:\n- El nombre 'mailserver' no está configurado en DNS\n- Problemas de conectividad con el servidor DNS\n- Configuración incorrecta de /etc/resolv.conf"
fi

run_test "Netcat Mailserver Puerto 25" "docker exec app nc -zv mailserver 25" "succeeded|open"
if [ $? -eq 0 ]; then
  netcat_output=$(docker exec app nc -zv mailserver 25 2>&1)
  SMTP_SERVICE_ACTIVE="Activo"
  add_test_result "Netcat Mailserver Puerto 25" "passed" "✓ Puerto 25 accesible" \
    "Resultado de netcat:\n$netcat_output\n\nImplicaciones:\n- El servicio SMTP está escuchando en el puerto 25\n- No hay firewalls bloqueando el acceso"
else
  add_test_result "Netcat Mailserver Puerto 25" "failed" "✗ Puerto 25 inaccesible" \
    "Resultado de netcat:\n$(docker exec app nc -zv mailserver 25 2>&1)\n\nDiagnóstico:\n- El servicio SMTP no está corriendo\n- Un firewall está bloqueando el puerto\n- El contenedor no está correctamente enlazado al puerto 25"
fi

# Cerrar secciones HTML
cat >> "$REPORT_FILE" <<EOF
    <div class="conclusion">
      <h2>Conclusión Técnica</h2>
      <p>Basado en los resultados de las pruebas, el servidor de correo presenta las siguientes características:</p>
      <ul>
        <li><strong>Conectividad básica:</strong> $([ $PASSED_TESTS -gt 0 ] && echo "Funcional" || echo "No funcional")</li>
        <li><strong>Servicio SMTP:</strong> $SMTP_SERVICE_ACTIVE</li>
        <li><strong>Entrega de correos:</strong> $MAIL_DELIVERY_OPERATIONAL</li>
      </ul>
      <p>Se recomienda revisar los detalles técnicos de cada prueba para identificar posibles áreas de mejora.</p>
    </div>
  </div>
</body>
</html>
EOF

# Actualizar contadores en el HTML
TEMP_FILE=$(mktemp)
sed -e "s|<div class=\"stat-value\" id=\"total-count\">0</div>|<div class=\"stat-value\" id=\"total-count\">$TOTAL_TESTS</div>|" \
    -e "s|<div class=\"stat-value\" id=\"passed-count\">0</div>|<div class=\"stat-value\" id=\"passed-count\">$PASSED_TESTS</div>|" \
    -e "s|<div class=\"stat-value\" id=\"failed-count\">0</div>|<div class=\"stat-value\" id=\"failed-count\">$((TOTAL_TESTS - PASSED_TESTS))</div>|" \
    "$REPORT_FILE" > "$TEMP_FILE"

mv "$TEMP_FILE" "$REPORT_FILE"

# Crear enlace simbólico para el reporte
ln -sf "$REPORT_FILE" "${PWD}/app/reports/email_report.html" 2>/dev/null || {
  echo "Advertencia: No se pudo crear el enlace simbólico en ${PWD}/app/reports/"
}

echo "Reporte técnico de conectividad SMTP generado: $REPORT_FILE"
echo "Accesible en: file://$REPORT_FILE"

# Mostrar resumen de errores al final
if [ -f "$ERROR_FILE" ]; then
  ERROR_COUNT=$(grep -c "=== .* ===" "$ERROR_FILE")
  
  echo ""
  echo "----------------------------------------"
  echo " RESUMEN DE ERRORES ($ERROR_COUNT encontrados)"
  echo "----------------------------------------"
  
  if [ "$ERROR_COUNT" -gt 0 ]; then
    cat "$ERROR_FILE"
    echo ""
    echo "----------------------------------------"
    echo "¡Se encontraron $ERROR_COUNT errores que necesitan atención!"
    echo "Revisa el archivo completo en: $ERROR_FILE"
  else
    echo "¡No se encontraron errores! Todas las pruebas pasaron correctamente."
    rm "$ERROR_FILE"  # Eliminamos el archivo si no hay errores
  fi
fi