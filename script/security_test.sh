#!/bin/bash

# Configuración
REPORT_DIR="/zap/reports"
REPORT_FILE="${REPORT_DIR}/security_report.html"
ERROR_FILE="${REPORT_DIR}/security_errors.txt" 
ZAP_URL="http://localhost:8081"
ZAP_API_KEY="my_zap_api_key"
TARGET_URL="https://php"
VAULT_URL="https://localhost:8200"
VAULT_TOKEN=$(cat /vault/data/ui_token.txt)
CURRENT_DATE=$(date +"%d/%m/%Y a las %H:%M:%S")

# Crear directorio de reportes
mkdir -p "$REPORT_DIR"

# Inicializar archivo de errores
echo "Resumen de Errores de Seguridad - $CURRENT_DATE" > "$ERROR_FILE"
echo "==============================================" >> "$ERROR_FILE"
echo "" >> "$ERROR_FILE"

# Función para ejecutar y capturar resultado
run_test() {
  local name="$1"
  local command="$2"
  local success_pattern="$3"

  echo "Ejecutando prueba: $name"
  output=$(eval "$command" 2>&1)

  if [[ "$output" =~ $success_pattern ]]; then
    echo "   [✅] Éxito"
    return 0
  else
    echo "   [❌] Fallo"
    echo "   Salida: $output"
    # Añadir error al archivo de errores
    {
      echo "=== $name ==="
      echo "Comando ejecutado: $command"
      echo "Error: $output"
      echo ""
    } >> "$ERROR_FILE"
    return 1
  fi
}

# Contadores de pruebas
TOTAL_TESTS=0
PASSED_TESTS=0

# Función para analizar el reporte ZAP
analyze_zap_report() {
  local report_file="/zap/reports/zap_report.html"
  local error_count=0
  local warning_count=0
  local info_count=0
  local zap_status="passed"

  if [ -f "$report_file" ]; then
    error_count=$(grep -ic "risk-3" "$report_file")
    warning_count=$(grep -ic "risk-2" "$report_file")
    info_count=$(grep -ic "risk-1" "$report_file")

    if [ "$error_count" -gt 0 ] || [ "$warning_count" -gt 0 ]; then
      zap_status="failed" # Cambiamos el estado si hay errores
    fi

    # Añadimos la casilla de resultado de ZAP al reporte
    if [ "$zap_status" == "passed" ]; then
      add_test_result "Vulnerabilidades encontradas en ZAP" "passed" "✓ No se encontraron vulnerabilidades" "ZAP no encontró ninguna vulnerabilidad de gravedad alta o media."
    else
      add_test_result "Vulnerabilidades encontradas en ZAP" "failed" "✗ Vulnerabilidades encontradas" "ZAP detectó vulnerabilidades de gravedad alta o media. <a href='/zap_reports/zap_report.html' target='_blank'>Ver reporte detallado</a>"
    fi

    echo ""
    echo "----------------------------------------"
    echo " RESUMEN ERRORES REPORTE ZAP ($((error_count + warning_count + info_count)) encontrados)"
    echo "----------------------------------------"
    echo "[❌] Errores de alta severidad: $error_count"
    echo "[⚠️ ] Advertencias de media severidad: $warning_count"
    echo "[ℹ️ ] Alertas informativas: $info_count"
    echo ""

    if [ "$error_count" -gt 0 ] || [ "$warning_count" -gt 0 ]; then
      echo "¡Se encontraron vulnerabilidades que necesitan atención!"
      echo "Revisa el reporte completo en: $report_file"
    else
      echo "No se encontraron vulnerabilidades de alta o media severidad."
    fi
  else
    echo "No se encontró el reporte ZAP: $report_file"
  fi
}

# Función para añadir resultados al reporte con explicaciones detalladas
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
    "XSS Test")
      explanation="Prueba de Cross-Site Scripting (XSS) que intenta inyectar código JavaScript malicioso."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Permite a atacantes ejecutar scripts en el navegador de los usuarios.</div>"
      test_name_display="<span style='color: #e74c3c; font-weight: bold;'>XSS Test</span>"
      ;;
    "SQL Injection Test")
      explanation="Prueba de inyección SQL que intenta manipular consultas a la base de datos."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Puede permitir acceso no autorizado a datos sensibles.</div>"
      test_name_display="<span style='color: #f39c12; font-weight: bold;'>SQL Injection Test</span>"
      ;;
    "LFI Attack Test")
      explanation="Prueba de Local File Inclusion que intenta acceder a archivos del sistema."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Puede exponer información confidencial del servidor.</div>"
      test_name_display="<span style='color: #9b59b6; font-weight: bold;'>LFI Attack Test</span>"
      ;;
    "HTTP Method Override Test")
      explanation="Prueba de manipulación de métodos HTTP."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Puede permitir eludir restricciones de métodos HTTP.</div>"
      test_name_display="<span style='color: #1abc9c; font-weight: bold;'>HTTP Method Override Test</span>"
      ;;
    "Malicious User-Agent Test")
      explanation="Prueba de detección de user-agents maliciosos."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Puede permitir herramientas de ataque automatizadas.</div>"
      test_name_display="<span style='color: #d35400; font-weight: bold;'>Malicious User-Agent Test</span>"
      ;;
    "Vault Health Check")
      explanation="Verificación del estado del servicio HashiCorp Vault para gestión de secretos."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Los secretos de la aplicación podrían no estar protegidos adecuadamente.</div>"
      test_name_display="<span style='color: #2ecc71; font-weight: bold;'>Vault Health Check</span>"
      ;;
    "Vault Secret Access")
      explanation="Prueba de acceso autorizado a secretos en Vault."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Problemas en la gestión de credenciales y secretos.</div>"
      test_name_display="<span style='color: #2ecc71; font-weight: bold;'>Vault Secret Access</span>"
      ;;
    "Vault Unauthorized Access")
      explanation="Prueba de acceso no autorizado a secretos en Vault."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Falta de control de acceso adecuado en Vault.</div>"
      test_name_display="<span style='color: #2ecc71; font-weight: bold;'>Vault Unauthorized Access</span>"
      ;;
    "ZAP Scan")
      explanation="Escaneo completo de seguridad realizado por OWASP ZAP."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> No se pudo completar el análisis de vulnerabilidades. Consulte el informe detallado.</div>"
      test_name_display="<span style='color: #3498db; font-weight: bold;'>ZAP Scan</span>"
      ;;
    "SSLv3 Test")
      explanation="Prueba de compatibilidad con protocolo SSLv3 inseguro."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Uso de protocolos criptográficos obsoletos e inseguros.</div>"
      test_name_display="<span style='color: #27ae60; font-weight: bold;'>SSLv3 Test</span>"
      ;;
    "TLS Cipher Suites Test")
      explanation="Prueba de suites de cifrado TLS soportadas."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Uso de cifrados débiles que comprometen la confidencialidad.</div>"
      test_name_display="<span style='color: #27ae60; font-weight: bold;'>TLS Cipher Suites Test</span>"
      ;;
    "ModSecurity Paranoia Level Test")
      explanation="Prueba de nivel de paranoia en ModSecurity."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Configuración demasiado permisiva del WAF.</div>"
      test_name_display="<span style='color: #e67e22; font-weight: bold;'>ModSecurity Paranoia Level Test</span>"
      ;;
    "File Upload Size Limit Test")
      explanation="Prueba de límite de tamaño de archivo en uploads."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Posibles ataques DoS mediante archivos grandes.</div>"
      test_name_display="<span style='color: #e67e22; font-weight: bold;'>File Upload Size Limit Test</span>"
      ;;
    "CSP Header Test")
      explanation="Prueba de presencia de Content Security Policy header."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Falta de protección contra inyección de contenido.</div>"
      test_name_display="<span style='color: #3498db; font-weight: bold;'>CSP Header Test</span>"
      ;;
    "HSTS Header Test")
      explanation="Prueba de presencia de HTTP Strict Transport Security header."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Falta de protección contra downgrade de HTTPS.</div>"
      test_name_display="<span style='color: #3498db; font-weight: bold;'>HSTS Header Test</span>"
      ;;
    "X-XSS-Protection Header Test")
      explanation="Prueba de presencia de X-XSS-Protection header."
      [[ "$status" == "failed" ]] && explanation+="<div class='error-details'><strong>Riesgo:</strong> Falta de protección básica contra XSS en navegadores.</div>"
      test_name_display="<span style='color: #3498db; font-weight: bold;'>X-XSS-Protection Header Test</span>"
      ;;
    *)
      test_name_display="<span style='font-weight: bold;'>$test_name</span>"
      ;;
  esac

  echo "<div class='$test_class'>" >> $REPORT_FILE
  echo "<h3>$test_name_display</h3>" >> $REPORT_FILE
  echo "<p><strong>Estado:</strong> <span class='$status'>$description</span></p>" >> $REPORT_FILE
  echo "<p>$explanation</p>" >> $REPORT_FILE
  echo "<pre>$details</pre>" >> $REPORT_FILE
  echo "</div>" >> $REPORT_FILE
}

# Generar encabezado del reporte
cat > $REPORT_FILE <<EOF
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe de Seguridad</title>
  <style type="text/css">
    body {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #333;
      font-size: 14px;
      line-height: 1.4;
      margin: 0;
      padding: 20px;
      background-color: #f9f9f9;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    h1 {
      text-align: center;
      font-weight: bold;
      font-size: 32px;
      color: #333;
      margin-bottom: 30px;
    }
    
    h2 {
      font-size: 24px;
      color: #444;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      margin-top: 30px;
    }
    
    h3 {
      font-size: 18px;
      color: #555;
      margin-top: 25px;
    }
    
    h4 {
      font-size: 16px;
      color: #666;
      margin-top: 20px;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
      font-size: 14px;
    }
    
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background-color: #666;
      color: white;
      font-weight: bold;
    }
    
    tr:nth-child(even) {
      background-color: #f8f8f8;
    }
    
    tr:hover {
      background-color: #f1f1f1;
    }
    
    .risk-3 {
      background-color: #d2322d;
      color: white;
      font-weight: bold;
    }
    
    .risk-2 {
      background-color: #ed9c28;
      color: white;
      font-weight: bold;
    }
    
    .risk-1 {
      background-color: #f0ad4e;
      color: #333;
      font-weight: bold;
    }
    
    .risk-0 {
      background-color: #428bca;
      color: white;
      font-weight: bold;
    }
    
    .risk--1 {
      background-color: #5cb85c;
      color: white;
      font-weight: bold;
    }
    
    .summary {
      width: 45%;
      margin: 20px auto;
    }
    
    .test-box {
      margin: 15px 0;
      padding: 15px;
      border-radius: 4px;
      background-color: #f8f8f8;
      border-left: 4px solid #ddd;
    }
    
    .test-box.passed {
      border-left-color: #5cb85c;
      background-color: #e8f5e9;
    }
    
    .test-box.failed {
      border-left-color: #d2322d;
      background-color: #fde8e8;
    }
    
    .test-box h3 {
      margin-top: 0;
      color: #333;
    }
    
    .test-box pre {
      background-color: white;
      padding: 10px;
      border-radius: 3px;
      border: 1px solid #ddd;
      overflow-x: auto;
    }
    
    .error-details {
      margin-top: 10px;
      padding: 10px;
      background-color: #ffebee;
      border-radius: 3px;
      border-left: 3px solid #f44336;
    }
    
    .header-section {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .header-section img {
      height: 60px;
      margin-bottom: 15px;
    }
    
    .timestamp {
      color: #777;
      font-size: 14px;
      margin-top: 10px;
    }
    
    .zap-link {
      display: inline-block;
      margin: 15px 0;
      padding: 10px 15px;
      background-color: #428bca;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    
    .zap-link:hover {
      background-color: #3276b1;
    }
    
    .summary-stats {
      display: flex;
      justify-content: center;
      margin: 20px 0;
      gap: 20px;
    }
    
    .stat-box {
      text-align: center;
      padding: 15px;
      border-radius: 4px;
      background-color: #f8f8f8;
      min-width: 120px;
    }
    
    .stat-label {
      font-weight: bold;
      margin-bottom: 5px;
      color: #555;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    
    .indent1 {
      padding-left: 20px;
    }
    
    .indent2 {
      padding-left: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-section">
      <h1>Informe de Seguridad</h1>
      <div class="timestamp">Generado el $CURRENT_DATE</div>
    </div>

    <div class="summary">
      <h2>Resumen</h2>
      <a href="/zap_reports/zap_report.html" class="zap-link" target="_blank">Ver Informe Completo de ZAP</a>
      <p>Este informe muestra los resultados de las pruebas de seguridad automatizadas realizadas en la aplicación.</p>

      <div class="summary-stats">
        <div class="stat-box">
          <div class="stat-label">Pruebas Totales</div>
          <div class="stat-value" id="total-count">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Pruebas Exitosas</div>
          <div class="stat-value" id="passed-count">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Pruebas Fallidas</div>
          <div class="stat-value" id="failed-count">0</div>
        </div>
      </div>
    </div>

    <h2>Resultados por Categoría</h2>
    
    <h3>Pruebas de WAF/ModSecurity</h3>
    <p>Estas pruebas verifican que el Web Application Firewall esté bloqueando ataques comunes.</p>
EOF

# 1. Pruebas WAF/ModSecurity
run_test "XSS Test" "curl -ks -o /dev/null -w '%{http_code}' '$TARGET_URL/?param=%3Cscript%3Ealert(1)%3C/script%3E'" "^403$"
if [ $? -eq 0 ]; then
  add_test_result "XSS Test" "passed" "✓ Bloqueado correctamente" "El WAF detectó y bloqueó el intento de XSS (código de estado: 403)"
else
  add_test_result "XSS Test" "failed" "✗ No bloqueado" "El WAF permitió el payload XSS (código de estado: ${output:-N/A})"
fi

run_test "SQL Injection Test" "curl -ks -o /dev/null -w '%{http_code}' '$TARGET_URL/?id=1%27%20OR%20%271%27=%271'" "^403$"
if [ $? -eq 0 ]; then
  add_test_result "SQL Injection Test" "passed" "✓ Bloqueado correctamente" "El WAF detectó y bloqueó el intento de SQL injection (código de estado: 403)"
else
  add_test_result "SQL Injection Test" "failed" "✗ No bloqueado" "El WAF permitió el payload SQLi (código de estado: ${output:-N/A})"
fi

run_test "LFI Attack Test" "curl -ks -o /dev/null -w '%{http_code}' '$TARGET_URL/../../etc/passwd'" "^403$"
if [ $? -eq 0 ]; then
  add_test_result "LFI Attack Test" "passed" "✓ Bloqueado correctamente" "El WAF detectó y bloqueó el intento de LFI (código de estado: 403)"
else
  add_test_result "LFI Attack Test" "failed" "✗ No bloqueado" "El WAF permitió el intento de LFI (código de estado: ${output:-N/A})"
fi

run_test "HTTP Method Override Test" "curl -ks -o /dev/null -w '%{http_code}' -X POST -H 'X-HTTP-Method-Override: DELETE' '$TARGET_URL/api/data'" "^403$"
if [ $? -eq 0 ]; then
  add_test_result "HTTP Method Override Test" "passed" "✓ Bloqueado correctamente" "El WAF detectó y bloqueó el intento de override (código de estado: 403)"
else
  add_test_result "HTTP Method Override Test" "failed" "✗ No bloqueado" "El WAF permitió el override de método HTTP (código de estado: ${output:-N/A})"
fi

run_test "Malicious User-Agent Test" "curl -ks -o /dev/null -w '%{http_code}' -A 'sqlmap' '$TARGET_URL'" "^403$"
if [ $? -eq 0 ]; then
  add_test_result "Malicious User-Agent Test" "passed" "✓ Bloqueado correctamente" "El WAF detectó y bloqueó el user-agent malicioso (código de estado: 403)"
else
  add_test_result "Malicious User-Agent Test" "failed" "✗ No bloqueado" "El WAF permitió el user-agent malicioso (código de estado: ${output:-N/A})"
fi

# 2. Pruebas Vault
echo "</div><div class='test-section'>" >> $REPORT_FILE
echo "<h2>Pruebas de HashiCorp Vault</h2>" >> $REPORT_FILE
echo "<p>Estas pruebas verifican el estado del servicio de gestión de secretos.</p>" >> $REPORT_FILE
echo "<div class='test-grid'>" >> $REPORT_FILE

run_test "Vault Health Check" "curl -ks -o /dev/null -w '%{http_code}' '$VAULT_URL/v1/sys/health'" "^(200|429)$"
if [ $? -eq 0 ]; then
  add_test_result "Vault Health Check" "passed" "✓ Servicio funcionando" "Vault respondió correctamente (código de estado: ${output})"
else
  add_test_result "Vault Health Check" "failed" "✗ Servicio no disponible" "Vault no respondió (código de estado: ${output:-N/A})"
fi

run_test "Vault Secret Access" "curl -ks -o /dev/null -w '%{http_code}' -H 'X-Vault-Token: $VAULT_TOKEN' '$VAULT_URL/v1/secret/data/transcendence/api_keys'" "^200$"
if [ $? -eq 0 ]; then
  add_test_result "Vault Secret Access" "passed" "✓ Acceso autorizado correcto" "Se pudo acceder a los secretos con token válido (código de estado: 200)"
else
  add_test_result "Vault Secret Access" "failed" "✗ Error en acceso autorizado" "No se pudo acceder a los secretos con token válido (código de estado: ${output:-N/A})"
fi

run_test "Vault Unauthorized Access" "curl -ks -o /dev/null -w '%{http_code}' -H 'X-Vault-Token: invalid' '$VAULT_URL/v1/secret/data/transcendence/api_keys'" "^403$"
if [ $? -eq 0 ]; then
  add_test_result "Vault Unauthorized Access" "passed" "✓ Acceso no autorizado bloqueado" "Vault bloqueó acceso con token inválido (código de estado: 403)"
else
  add_test_result "Vault Unauthorized Access" "failed" "✗ Acceso no autorizado permitido" "Vault permitió acceso con token inválido (código de estado: ${output:-N/A})"
fi

# 3. Pruebas TLS/SSL
echo "</div><div class='test-section'>" >> $REPORT_FILE
echo "<h2>Pruebas de TLS/SSL</h2>" >> $REPORT_FILE
echo "<p>Estas pruebas verifican la configuración de seguridad de la capa de transporte.</p>" >> $REPORT_FILE
echo "<div class='test-grid'>" >> $REPORT_FILE

run_test "SSLv3 Test" "openssl s_client -connect localhost:443 -ssl3 2>&1 | grep -q 'sslv3 alert handshake failure'" "^$"
if [ $? -eq 0 ]; then
  add_test_result "SSLv3 Test" "passed" "✓ Protocolo inseguro deshabilitado" "SSLv3 correctamente deshabilitado"
else
  add_test_result "SSLv3 Test" "failed" "✗ Protocolo inseguro habilitado" "SSLv3 está habilitado, lo cual es inseguro"
fi

run_test "TLS Cipher Suites Test" "nmap --script ssl-enum-ciphers -p 443 localhost | grep -q 'TLSv1.2.*strong'" "^$"
if [ $? -eq 0 ]; then
  add_test_result "TLS Cipher Suites Test" "passed" "✓ Cifrados fuertes habilitados" "Solo suites TLS 1.2/1.3 con cifrados fuertes"
else
  add_test_result "TLS Cipher Suites Test" "failed" "✗ Cifrados débiles detectados" "Se encontraron suites de cifrado débiles"
fi

# 4. Pruebas de Headers de Seguridad
echo "</div><div class='test-section'>" >> $REPORT_FILE
echo "<h2>Pruebas de Headers de Seguridad</h2>" >> $REPORT_FILE
echo "<p>Estas pruebas verifican los headers de seguridad HTTP.</p>" >> $REPORT_FILE
echo "<div class='test-grid'>" >> $REPORT_FILE

run_test "CSP Header Test" "curl -ksI '$TARGET_URL' | grep -i 'Content-Security-Policy'" "^.*$"
if [ $? -eq 0 ]; then
  csp_header=$(curl -ksI "$TARGET_URL" | grep -i 'Content-Security-Policy')
  add_test_result "CSP Header Test" "passed" "✓ Header CSP presente" "Content-Security-Policy: $csp_header"
else
  add_test_result "CSP Header Test" "failed" "✗ Header CSP ausente" "Falta el header Content-Security-Policy"
fi

run_test "HSTS Header Test" "curl -ksI '$TARGET_URL' | grep -i 'Strict-Transport-Security'" "^.*$"
if [ $? -eq 0 ]; then
  hsts_header=$(curl -ksI "$TARGET_URL" | grep -i 'Strict-Transport-Security')
  add_test_result "HSTS Header Test" "passed" "✓ Header HSTS presente" "Strict-Transport-Security: $hsts_header"
else
  add_test_result "HSTS Header Test" "failed" "✗ Header HSTS ausente" "Falta el header Strict-Transport-Security"
fi

run_test "X-XSS-Protection Header Test" "curl -ksI '$TARGET_URL' | grep -i 'X-XSS-Protection'" "^.*$"
if [ $? -eq 0 ]; then
  xss_header=$(curl -ksI "$TARGET_URL" | grep -i 'X-XSS-Protection')
  add_test_result "X-XSS-Protection Header Test" "passed" "✓ Header X-XSS-Protection presente" "X-XSS-Protection: $xss_header"
else
  add_test_result "X-XSS-Protection Header Test" "failed" "✗ Header X-XSS-Protection ausente" "Falta el header X-XSS-Protection"
fi

# 5. Escaneo ZAP
echo "</div><div class='test-section'>" >> $REPORT_FILE
echo "<h2>Escaneo de Seguridad con OWASP ZAP</h2>" >> $REPORT_FILE
echo "<p>Escaneo automatizado de vulnerabilidades web.</p>" >> $REPORT_FILE
echo "<div class='test-grid'>" >> $REPORT_FILE

# Ejecutar escaneo ZAP
/zap/wrk/zap_scan.sh

# Verificar reporte ZAP
if [ -f "/zap/reports/zap_report.html" ]; then
  add_test_result "ZAP Scan" "passed" "✓ Escaneo completado" "El escaneo de seguridad se completó exitosamente."
  analyze_zap_report
else
  add_test_result "ZAP Scan" "failed" "✗ Error generando reporte" "No se pudo generar el reporte de ZAP. Verifique los logs para más información."
fi

# Cerrar secciones HTML
echo "</div></div>" >> $REPORT_FILE

# Actualizar contadores en el HTML
TEMP_FILE=$(mktemp)
sed -e "s|<div class=\"stat-value\" id=\"total-count\">0</div>|<div class=\"stat-value\" id=\"total-count\">$TOTAL_TESTS</div>|" \
    -e "s|<div class=\"stat-value\" id=\"passed-count\">0</div>|<div class=\"stat-value\" id=\"passed-count\">$PASSED_TESTS</div>|" \
    -e "s|<div class=\"stat-value\" id=\"failed-count\">0</div>|<div class=\"stat-value\" id=\"failed-count\">$((TOTAL_TESTS - PASSED_TESTS))</div>|" \
    $REPORT_FILE > $TEMP_FILE

mv $TEMP_FILE $REPORT_FILE

# Finalizar el HTML
cat >> $REPORT_FILE <<EOF
  </div>
</body>
</html>
EOF

# Crear enlace simbólico para el reporte
#ln -sf $REPORT_FILE /zap/reports/security_report.html

echo "Reporte de seguridad generado: $REPORT_FILE"
echo "Accesible en: https://localhost/zap_reports/security_report.html"

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
