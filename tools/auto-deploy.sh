#!/bin/bash
# Deploy por pull: o servidor observa a main e se atualiza sozinho.
#
# Generico de proposito — descobre o repositorio pelo proprio caminho, entao este mesmo arquivo
# serve para todos os clientes sem uma variante por projeto.
#
# Instalacao (no servidor, uma vez):
#   */2 * * * * /var/www/<cliente>/tools/auto-deploy.sh
set -u

REPO="$(cd "$(dirname "$0")/.." && pwd)"
NOME="$(basename "$REPO")"
LOG="/var/log/${NOME}-auto-deploy.log"

cd "$REPO" || exit 1

# Um deploy por vez. Sem isso, um build lento faz o cron da rodada seguinte entrar no meio do
# anterior e os dois brigarem pelo mesmo working tree.
exec 9>"/var/lock/${NOME}-auto-deploy.lock"
flock -n 9 || exit 0

log(){ echo "[$(date -Is)] $*" >> "$LOG"; }

if ! git fetch --quiet origin main 2>>"$LOG"; then
  log "fetch falhou — a deploy key de leitura pode ter sido removida do repositorio"
  exit 1
fi

atual=$(git rev-parse HEAD)
novo=$(git rev-parse origin/main)
[ "$atual" = "$novo" ] && exit 0

log "main mudou: ${atual:0:7} -> ${novo:0:7}"
bash deploy.sh >> "$LOG" 2>&1
status=$?
log "deploy.sh terminou com status $status"
exit $status
