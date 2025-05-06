#!/bin/bash
# Script para actualizar secretos sin reiniciar el contenedor

vault kv put secret/transcendence/api_keys \
  jwt_secret="$(openssl rand -base64 32)" \
  zap_api_key="$(openssl rand -hex 32)"

vault kv put secret/transcendence/database \
  username="db_user_$(date +%s)" \
  password="$(openssl rand -hex 16)"

vault kv put secret/transcendence/auth \
  jwt_expires_in="1h" \
  refresh_expires_in="7d" \
  twofa_expires="15m"
