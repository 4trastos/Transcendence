#!/bin/bash

# Obtener la API Key desde Vault
API_KEY=$(vault kv get -field=api_key secret/myapp)

# Establecer la variable de entorno
export API_KEY="$API_KEY"