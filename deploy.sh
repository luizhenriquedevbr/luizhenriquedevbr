#!/bin/bash
# O que o workflow do GitHub Actions fazia por SSH, agora rodando no proprio servidor.
#
# Migrado em 31/08/2026. O modelo anterior guardava a chave root do droplet em
# secrets.SSH_PRIVATE_KEY; naquele dia um workflow injetado por terceiro fez POST dessa chave
# para um IP externo. Com o deploy invertido para pull, nao ha credencial de servidor no GitHub.
set -euo pipefail

cd /var/www/luizhenriquedevbr

# --ff-only: se alguem editou algo direto no servidor, o deploy para em vez de criar um merge
# silencioso que ninguem revisou. Melhor falhar e alguem olhar.
git pull --ff-only origin main

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "=== deploy concluido: $(date -Is) ==="
