#!/bin/bash
# Sobe a calculadora (luizhenrique.dev.br/calculadora). Chamado pelo deploy.sh do site,
# depois do git pull; também dá para rodar sozinho.
set -euo pipefail

cd "$(dirname "$0")"

# Senhas do banco ficam fora do repositório; sem o arquivo o deploy para, em vez de subir com senha padrão.
[ -f /root/calculadora-deploy.env ] || { echo "ERRO: /root/calculadora-deploy.env ausente" >&2; exit 1; }
. /root/calculadora-deploy.env
: "${CALC_DB_PASSWORD:?defina CALC_DB_PASSWORD em /root/calculadora-deploy.env}"
: "${CALC_DB_ROOT_PASSWORD:?defina CALC_DB_ROOT_PASSWORD em /root/calculadora-deploy.env}"
export CALC_DB_PASSWORD CALC_DB_ROOT_PASSWORD

[ -f api/.env.prod ] || { echo "ERRO: calculadora/api/.env.prod ausente — copie de api/.env.production.example" >&2; exit 1; }

docker compose -f docker-compose.prod.yml up -d --build

echo "=== calculadora: deploy concluido: $(date -Is) ==="
