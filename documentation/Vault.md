# Integración de Vault en TRANSCENDENCE

Este documento explica la integración de HashiCorp Vault en el proyecto TRANSCENDENCE, incluyendo configuración, buenas prácticas y uso desde scripts y la aplicación backend.

---

## 🔒 Objetivo

Vault se utiliza para almacenar y gestionar secretos sensibles como:

- Credenciales de base de datos
- API Keys
- Secretos JWT
- Tokens de sesión o configuraciones sensibles

---

## ⚙️ Configuración

### 1. Vault (`vault.hcl`)

- Vault escucha en `https://localhost:8200`
- TLS está habilitado (`cert.pem`, `key.pem`, `ca.crt`)
- Almacena datos en disco local (`/vault/data`)
- Se permite acceso a la UI

```hcl
listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/etc/vault/tls/cert.pem"
  tls_key_file  = "/etc/vault/tls/key.pem"
  tls_client_ca_file = "/etc/vault/tls/ca.crt"
}
```

---

### 2. Políticas (`policy.hcl`)

Vault aplica el principio de **mínimo privilegio**. Las rutas están restringidas por tipo de secreto:

- Solo lectura para: `database`, `redis`, `jwt`
- Lectura/escritura para: `api_keys`
- AppRole con permisos limitados para rotación y login

---

### 3. Scripts asociados

- `configure_vault.sh`: genera y almacena secretos (DB, Redis, JWT)
- `generate_secret_id.sh`: genera `secret_id` para AppRole
- `get_vault_secret.sh`: obtiene secretos con seguridad TLS y validación de token

---

## 📂 Uso desde la app

### `app.js`

- Inicializa Vault desde `node-vault`
- Usa `process.env.VAULT_ADDR` y `VAULT_TOKEN`
- Endpoint `/api/secret/:path` para debug

### `database.js`

- Exporta `getDbCredentials()` para uso posterior en entornos como PostgreSQL o MySQL
- SQLite **no depende** de Vault

```js
const { vault } = require('./app');

async function getDbCredentials() {
  const secret = await vault.read('secret/data/transcendence/database');
  return secret.data.data;
}
```

---

### `auth.js`

- Lee secreto JWT desde `.env` o desde Vault
- Firma y verifica tokens con información contextual (IP, agente, método auth)

---

## 📝 Buenas prácticas

- Nunca hardcodear secretos: usar Vault o `.env`
- Usar `VAULT_TOKEN` sólo en desarrollo, AppRole en producción
- Auditar y rotar `secret_id` regularmente (`generate_secret_id.sh`)
- Validar tokens antes de acceder a secretos

---

## 💪 Ventajas

- Seguridad centralizada y auditable
- Compatibilidad con TLS y autenticación basada en roles
- Políticas granulares
- Fácil integración con scripts bash y Node.js

---

## 📝 Referencias

- [Vault Docs](https://developer.hashicorp.com/vault/docs)
- [AppRole Auth Method](https://developer.hashicorp.com/vault/docs/auth/approle)
- [KV Secrets Engine](https://developer.hashicorp.com/vault/docs/secrets/kv/kv-v2)

---

## 🗄️ Estado actual

- [x] Vault inicializado y funcional
- [x] Scripts de configuración y rotación funcionando
- [x] Secretos disponibles para acceso desde backend
- [x] Seguridad por roles definida en `policy.hcl`

---

> ✅ Si estás en desarrollo, puedes verificar el estado de Vault accediendo a `https://localhost:8200` y autenticándote con tu `VAULT_TOKEN`

---

✨ **Todo está listo para escalar esto a producción cuando lo necesites.**

