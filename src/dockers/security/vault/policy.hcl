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