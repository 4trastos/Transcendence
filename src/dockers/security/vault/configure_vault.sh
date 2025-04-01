#!/bin/bash
# Script para actualizar secretos sin reiniciar el contenedor

vault kv put secret/transcendence/database \
  username="db_user_$(date +%s)" \
  password="$(openssl rand -hex 16)"

vault kv put secret/transcendence/redis \
  password="$(openssl rand -hex 16)"

vault kv put secret/transcendence/jwt \
  secret="$(openssl rand -base64 32)"