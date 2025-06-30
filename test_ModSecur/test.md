Guía de Pruebas Manuales de Seguridad (Concisa)
Esta guía concisa detalla cómo realizar manualmente las pruebas de seguridad para demostrar la funcionalidad de ModSecurity (WAF), la integración con HashiCorp Vault y la configuración de seguridad del servidor (TLS/Headers).

Asunciones Clave:

Tus contenedores Docker (Nginx, Backend, Vault) están en ejecución.

Nginx está escuchando en https://localhost:8443/backend/.

Vault está escuchando en https://localhost:8200.

Estás ejecutando los comandos desde una terminal en tu máquina local (macOS/Linux).

1. Preparación
Antes de iniciar las pruebas, asegúrate de cumplir con los siguientes puntos:

Habilitar ModSecurity: Asegura que ModSecurity esté on; en default.conf para la ruta /backend/.

Log Level ModSecurity: SecDebugLogLevel en 0 o 1 en /etc/nginx/modsec/modsecurity.conf.

Obtener Token de Vault
Este paso es crucial para las pruebas de Vault autorizadas. El token se genera en el contenedor de Vault.

Comando en Terminal:

export VAULT_TOKEN=$(docker exec -it security cat /vault/data/ui_token.txt)
echo "Tu token de Vault es: $VAULT_TOKEN" # Verifica que se muestre el token

2. Pruebas de WAF/ModSecurity (Bloqueo de Ataques)
Estas pruebas demuestran que ModSecurity está interceptando y bloqueando patrones de ataque comunes. Resultado Esperado General: 403 Forbidden (HTTP)

Prueba a Realizar

Comando en Terminal

Comando en Navegador

Resultado Esperado

XSS (Cross-Site Scripting)

curl -ks -I -w '%{http_code}\n' 'https://localhost:8443/backend/?param=<script>alert(1)</script>'

https://localhost:8443/backend/?param=<script>alert(1)</script>

Terminal: 403. Navegador: Página 403, NO ventana alert(1).

Inyección SQL

curl -ks -I -w '%{http_code}\n' 'https://localhost:8443/backend/?id=1%27%20OR%20%271%27=%271'

https://localhost:8443/backend/?id=1' OR '1'='1

Terminal: 403. Navegador: Página 403.

Inclusión de Archivos Locales

curl -ks -I -w '%{http_code}\n' 'https://localhost:8443/backend/../../../../etc/passwd'

https://localhost:8443/backend/../../../../etc/passwd

Terminal: 403. Navegador: Página 403.

HTTP Method Override

curl -ks -I -w '%{http_code}\n' -X POST -H 'X-HTTP-Method-Override: DELETE' 'https://localhost:8443/backend/api/data'

N/A (Requiere herramienta para añadir header)

Terminal: 403.

Malicious User-Agent

curl -ks -I -w '%{http_code}\n' -A 'sqlmap' 'https://localhost:8443/backend/'

N/A (Requiere herramienta para añadir header)

Terminal: 403.

3. Pruebas de HashiCorp Vault
Estas pruebas verifican la accesibilidad y el control de acceso a tu servicio Vault.

Prueba a Realizar

Comando en Terminal

Comando en Navegador

Resultado Esperado

Salud de Vault

curl -ks -I -w '%{http_code}\n' 'https://localhost:8200/v1/sys/health'

https://localhost:8200/v1/sys/health

Terminal: 200 o 429. Navegador: JSON initialized: true, sealed: false, HTTP 200.

Acceso Autorizado a Secreto

curl -ks -I -w '%{http_code}\n' -H "X-Vault-Token: $VAULT_TOKEN" 'https://localhost:8200/v1/secret/data/transcendence/api_keys'

N/A (Requiere herramienta para añadir header)

Terminal: 200.

Acceso No Autorizado a Secreto

curl -ks -I -w '%{http_code}\n' -H 'X-Vault-Token: invalid_token_here' 'https://localhost:8200/v1/secret/data/transcendence/api_keys'

N/A (Requiere herramienta para añadir header)

Terminal: 403.

4. Pruebas de TLS/SSL
Estas pruebas verifican la configuración de seguridad de la capa de transporte.

Prueba a Realizar

Comando en Terminal

Comando en Navegador

Resultado Esperado

Verificación SSLv3

`openssl s_client -connect localhost:8443 -ssl3 2>&1

grep 'sslv3 alert handshake failure'



Verificación Suites Cifrado

nmap --script ssl-enum-ciphers -p 8443 localhost

N/A

Puerto 8443 open, TLSv1.2 y TLSv1.3 listados, least strength: A.

5. Pruebas de Headers de Seguridad
Estas pruebas confirman la implementación de cabeceras HTTP que fortalecen la seguridad del cliente.

Prueba a Realizar

Comando en Terminal

Comando en Navegador

Resultado Esperado

Cabecera CSP

`curl -ksI 'https://localhost:8443/backend/'

grep -i 'Content-Security-Policy'`

Abrir https://localhost:8443/backend/. F12 -> Network -> Recargar -> Click solicitud principal -> Headers -> Buscar Content-Security-Policy.

Cabecera HSTS

`curl -ksI 'https://localhost:8443/backend/'

grep -i 'Strict-Transport-Security'`

(Mismos pasos que CSP) Buscar Strict-Transport-Security.

Cabecera X-XSS-Protection

`curl -ksI 'https://localhost:8443/backend/'

grep -i 'X-XSS-Protection'`

(Mismos pasos que CSP) Buscar X-XSS-Protection.

6. Escaneo de Seguridad con OWASP ZAP (Automatizado)
Esta es una prueba automatizada que ya tienes en tu script principal.

Prueba a Realizar

Comando en Terminal

Comando en Navegador

Resultado Esperado

ZAP Scan

security_test.sh

N/A

Script indica "Escaneo completado". Reporte ZAP final sin vulnerabilidades de alta/media severidad.