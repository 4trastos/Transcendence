# Acceso a métricas y estado de Vault
path "sys/metrics" {
  capabilities = ["read"]
}

path "sys/health" {
  capabilities = ["read"]
}

# Permiso para que el token se inspeccione y renueve
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Acceso a secretos específicos para Prometheus
path "secret/data/prometheus/*" {
  capabilities = ["read"]
}

path "secret/metadata/prometheus/" {
  capabilities = ["list"]
}
