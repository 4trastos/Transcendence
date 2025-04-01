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
  capabilities = ["read"]
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