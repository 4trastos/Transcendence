storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address = "0.0.0.0:8200"
  tls_cert_file = "/etc/vault/tls/cert.pem"
  tls_key_file = "/etc/vault/tls/key.pem"
  tls_client_ca_file = "/etc/vault/tls/ca.crt"
   tls_disable   = 0
}

api_addr = "https://security:8200"
cluster_addr = "https://security:8201"

ui = true