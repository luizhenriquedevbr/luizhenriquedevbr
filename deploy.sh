#!/bin/bash
# Deploy da calculadora, rodado no próprio servidor (modelo pull, como avora e luizhenriquedevbr):
# nenhuma credencial do servidor fica no GitHub; o servidor puxa com deploy key só de leitura.
set -euo pipefail

cd /var/www/calculadora
git fetch origin main
git reset --hard origin/main

# Senhas do banco ficam fora do repositório; sem o arquivo o deploy para, em vez de subir com senha padrão.
[ -f /root/calculadora-deploy.env ] || { echo "ERRO: /root/calculadora-deploy.env ausente" >&2; exit 1; }
. /root/calculadora-deploy.env
: "${CALC_DB_PASSWORD:?defina CALC_DB_PASSWORD em /root/calculadora-deploy.env}"
: "${CALC_DB_ROOT_PASSWORD:?defina CALC_DB_ROOT_PASSWORD em /root/calculadora-deploy.env}"
export CALC_DB_PASSWORD CALC_DB_ROOT_PASSWORD

[ -f api/.env.prod ] || { echo "ERRO: api/.env.prod ausente — copie de api/.env.production.example" >&2; exit 1; }

docker compose -f docker-compose.prod.yml up -d --build

echo "=== deploy concluido: $(date -Is) ==="
