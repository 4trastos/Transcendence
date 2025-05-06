# Acceso administrativo limitado
path "sys/seal" {
  capabilities = ["update"]
}

path "sys/health" {
  capabilities = ["read", "sudo"]
}

# Gestión de secretos
path "secret/data/transcendence/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Acceso a secretos JWT
path "secret/data/transcendence/jwt" {
  capabilities = ["read", "update"]  # Permite rotación de claves
}

# Acceso a secretos de la base de datos
path "secret/data/transcendence/database" {
  capabilities = ["read"]  # Solo lectura para seguridad
}

# Acceso a secretos de Redis
path "secret/data/transcendence/redis" {
  capabilities = ["read"]
}

path "secret/data/transcendence/users/*" {
  capabilities = ["create", "read", "update", "delete"]
}


path "secret/data/transcendence/auth/*" {
  capabilities = ["read", "create", "update", "list"]
}

# Acceso a autenticación
path "auth/userpass/login/*" {
  capabilities = ["create", "update"]
}

# Acceso a políticas
path "sys/policies/acl/transcendence" {
  capabilities = ["read"]
}

# Monitorización
path "sys/metrics" {
  capabilities = ["read", "list"]
}

path "secret/data/transcendence/api_keys" {
  capabilities = ["read", "create", "update", "delete"]
  allowed_parameters = {
    "version" = []
  }
}

path "sys/policies/acl" {
  capabilities = ["read", "list"]
}

path "sys/policies/acl/*" {
  capabilities = ["read", "list"]
}

# Permisos para AppRole
path "auth/approle/role/transcendence-app/role-id" {
  capabilities = ["read"]
}

path "auth/approle/role/transcendence-app/secret-id" {
  capabilities = ["create", "update"]
}

path "auth/approle/login" {
  capabilities = ["create", "update"]
}

# Permitir listar los mounts en la UI (necesario para kv list)
path "sys/internal/ui/mounts/*" {
  capabilities = ["read"]
}

# Permitir que el token se inspeccione a sí mismo
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

# Permitir listar metadatos de los secretos (requerido para `kv list`)
path "secret/metadata/*" {
  capabilities = ["read", "list"]
}
