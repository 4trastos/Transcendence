#!/bin/bash

# Configuración idéntica a security_report.sh
REPORT_DIR="/zap/reports"
REPORT_FILE="${REPORT_DIR}/email_report.html"
ERROR_FILE="${REPORT_DIR}/email_errors.txt"
CURRENT_DATE=$(date +"%d/%m/%Y a las %H:%M:%S")

# Función para crear directorio con la misma lógica que security_report.sh
create_report_dir() {
    # Intenta crear el directorio principal
    if ! mkdir -p "$REPORT_DIR" 2>/dev/null; then
        echo "Error: No se pudo crear $REPORT_DIR"
        echo "Intentando crear directorio alternativo..."
        
        # Fallback 1: Intentar en /tmp/zap/reports
        REPORT_DIR="/tmp/zap/reports"
        if ! mkdir -p "$REPORT_DIR" 2>/dev/null; then
            # Fallback 2: Intentar en el directorio actual
            REPORT_DIR="${PWD}/zap_reports"
            mkdir -p "$REPORT_DIR" || {
                echo "Error crítico: No se pudo crear ningún directorio para reportes"
                exit 1
            }
        fi
        
        REPORT_FILE="${REPORT_DIR}/email_report.html"
        ERROR_FILE="${REPORT_DIR}/email_errors.txt"
    fi
    
    echo "Directorio de reportes: $REPORT_DIR"
}

# Crear directorio de reportes
create_report_dir

# Inicializar archivos (igual que security_report.sh)
echo "Resumen de Errores de Email - $CURRENT_DATE" > "$ERROR_FILE"
echo "==========================================" >> "$ERROR_FILE"
echo "" >> "$ERROR_FILE"

# Función para verificar dependencias
check_dependencies() {
    local dependencies=("docker" "ping" "nc" "nslookup" "mail")
    local missing=0
    
    for cmd in "${dependencies[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            echo "Error: $cmd no está instalado" >> "$ERROR_FILE"
            ((missing++))
        fi
    done
    
    [ $missing -eq 0 ] || {
        echo "Faltan $missing dependencias necesarias. Ver detalles en $ERROR_FILE"
        exit 1
    }
}

# Verificar dependencias
check_dependencies

# Función para ejecutar pruebas (igual que security_report.sh)
run_test() {
    local name="$1"
    local command="$2"
    local success_pattern="$3"

    echo "Ejecutando prueba: $name"
    output=$(eval "$command" 2>&1)
    local exit_code=$?

    {
        echo "=== $name ==="
        echo "Hora: $(date +"%Y-%m-%d %H:%M:%S")"
        echo "Comando: $command"
        echo "Código salida: $exit_code"
        echo "Salida:"
        echo "$output"
        echo ""
    } >> "$ERROR_FILE"

    if [[ $exit_code -eq 0 ]] && [[ "$output" =~ $success_pattern ]]; then
        echo "   [✅] Éxito"
        return 0
    else
        echo "   [❌] Fallo (Código: $exit_code)"
        echo "   Salida: $output"
        return 1
    fi
}

# Contadores de pruebas (igual que security_report.sh)
TOTAL_TESTS=0
PASSED_TESTS=0

# Función para añadir resultados al reporte (estilo security_report.sh)
add_test_result() {
    local test_name="$1"
    local status="$2"
    local status_text="$3"
    local details="$4"

    ((TOTAL_TESTS++))
    [[ $status == "passed" ]] && ((PASSED_TESTS++))

    local status_class=$status
    local status_icon=$([ "$status" == "passed" ] && echo "✓" || echo "✗")

    # Asegurar que el archivo HTML existe
    [ -f "$REPORT_FILE" ] || generate_html_header

    # Añadir resultado al reporte HTML
    cat >> "$REPORT_FILE" <<EOF
<div class="test-box $status_class">
    <h3>$test_name</h3>
    <p><strong>Estado:</strong> <span class="$status">$status_icon $status_text</span></p>
    <div class="details">
        <pre>$(echo "$details" | sed 's/</\&lt;/g; s/>/\&gt;/g')</pre>
    </div>
</div>
EOF
}

# Función para generar encabezado HTML (estilo security_report.sh)
generate_html_header() {
    cat > "$REPORT_FILE" <<EOF
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Pruebas de Email - $CURRENT_DATE</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .test-box {
            margin: 15px 0;
            padding: 15px;
            border-left: 4px solid #ddd;
            background-color: #f8f8f8;
        }
        .test-box.passed {
            border-left-color: #5cb85c;
            background-color: #e8f5e9;
        }
        .test-box.failed {
            border-left-color: #d2322d;
            background-color: #fde8e8;
        }
        .details pre {
            background: white;
            padding: 10px;
            border-radius: 3px;
            overflow-x: auto;
        }
        .summary-stats {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        .stat-box {
            padding: 15px;
            background: #f8f8f8;
            text-align: center;
            flex: 1;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Informe de Pruebas de Email</h1>
        <p>Generado el $CURRENT_DATE</p>
        
        <div class="summary-stats">
            <div class="stat-box">
                <h3>Pruebas Totales</h3>
                <p id="total-count">0</p>
            </div>
            <div class="stat-box">
                <h3>Pruebas Exitosas</h3>
                <p id="passed-count">0</p>
            </div>
            <div class="stat-box">
                <h3>Pruebas Fallidas</h3>
                <p id="failed-count">0</p>
            </div>
        </div>
EOF
}

# Función para generar pie de HTML (estilo security_report.sh)
generate_html_footer() {
    cat >> "$REPORT_FILE" <<EOF
    </div>
    <script>
        document.getElementById('total-count').textContent = '$TOTAL_TESTS';
        document.getElementById('passed-count').textContent = '$PASSED_TESTS';
        document.getElementById('failed-count').textContent = '$((TOTAL_TESTS - PASSED_TESTS))';
    </script>
</body>
</html>
EOF
}

# Generar encabezado del reporte HTML
generate_html_header

# ----------------------------
# Ejecución de pruebas SMTP
# ----------------------------

# 1. Prueba de conexión SMTP
run_test "Conexión SMTP" "nc -zv mailserver 25" "succeeded|open"
if [ $? -eq 0 ]; then
    add_test_result "Conexión SMTP" "passed" "Conexión exitosa" \
        "El servidor SMTP está accesible en el puerto 25"
else
    add_test_result "Conexión SMTP" "failed" "Fallo de conexión" \
        "No se pudo establecer conexión con el servidor SMTP en el puerto 25\n\nPosibles causas:\n- Servicio SMTP no está corriendo\n- Firewall bloqueando el puerto\n- Problemas de red"
fi

# 2. Prueba de envío de email
TEST_EMAIL="test-$(date +%s)@example.com"
run_test "Envío de Email" "echo 'Email de prueba' | mail -s 'Prueba SMTP' $TEST_EMAIL" "sent|delivered"
if [ $? -eq 0 ]; then
    add_test_result "Envío de Email" "passed" "Email enviado correctamente" \
        "El email de prueba fue enviado exitosamente a $TEST_EMAIL"
else
    add_test_result "Envío de Email" "failed" "Fallo en envío de email" \
        "No se pudo enviar el email de prueba a $TEST_EMAIL\n\nError detallado:\n$output"
fi

# 3. Prueba de logs del mailserver
if docker ps | grep -q mailserver; then
    LOG_OUTPUT=$(docker logs mailserver 2>&1 | tail -n 20)
    if echo "$LOG_OUTPUT" | grep -q "$TEST_EMAIL"; then
        add_test_result "Registro en Logs" "passed" "Email registrado en logs" \
            "El email de prueba aparece en los logs del servidor"
    else
        add_test_result "Registro en Logs" "failed" "Email no encontrado en logs" \
            "El email de prueba no aparece en los logs recientes\n\nÚltimas líneas de log:\n$LOG_OUTPUT"
    fi
else
    add_test_result "Registro en Logs" "failed" "Contenedor mailserver no disponible" \
        "No se pudo acceder a los logs porque el contenedor mailserver no está corriendo"
fi

# Finalizar el reporte HTML
generate_html_footer

echo "Reporte de email generado: $REPORT_FILE"
echo "Accesible en: https://localhost:8443/zap_reports/email_report.html"

# Mostrar resumen de errores (igual que security_report.sh)
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
    else
        echo "¡No se encontraron errores! Todas las pruebas pasaron correctamente."
    fi
fi