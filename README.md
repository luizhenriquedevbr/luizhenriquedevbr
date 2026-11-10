# Calculadora de custo - Miguel Maker

Calcula o custo de uma peça impressa em 3D (material, energia, desgaste da impressora e extras) e guarda o cálculo de cada peça, com os valores usados naquele dia.

- `api/`: Laravel (API, MySQL). `app/`: React + Vite + Tailwind.
- O custo de uma peça salva só muda com confirmação: editar, comparar, confirmar; ou "Atualizar valores", comparar, salvar.

## Como subir

```bash
cp api/.env.example api/.env.docker
# edite api/.env.docker: senhas do banco e ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD
docker compose up -d --build
docker compose exec api php artisan key:generate
docker compose exec api php artisan migrate --force
docker compose exec api php artisan db:seed
```

- API: http://localhost:8011/api
- App: http://localhost:5184
- O MySQL não expõe porta; só a rede interna do compose acessa.
- O usuário de login vem de `ADMIN_*` no `.env.docker` e é criado pelo `db:seed`.

## Produção

https://calculadora.luizhenrique.dev.br, no droplet com Traefik, em `/var/www/calculadora`. O servidor puxa do GitHub com deploy key só de leitura e roda `deploy.sh` (nenhuma credencial do servidor fica no GitHub).

- `docker-compose.prod.yml`: só o `app` (nginx) fica na rede `web` do Traefik; ele serve o React e repassa `/api` para a API. API e MySQL ficam na rede interna, sem porta publicada.
- Senhas do banco: `/root/calculadora-deploy.env` (`CALC_DB_PASSWORD`, `CALC_DB_ROOT_PASSWORD`). Sem esse arquivo o deploy para.
- Configuração da API: `api/.env.prod`, copiado de `api/.env.production.example` (`APP_DEBUG=false`).
- **Dados fora do git:** volume `calculadora_db_data` (peças, cadastros, tarifa), volume `calculadora_storage_data` (logs), `api/.env.prod` e `/root/calculadora-deploy.env`. Numa migração de servidor, copie os quatro antes de desligar o antigo.

### Primeiro deploy

```bash
# 1. DNS: registro A calculadora.luizhenrique.dev.br -> IP do droplet
# 2. No servidor
ssh-keygen -t ed25519 -f ~/.ssh/calculadora_deploy -N ""   # chave pública vai em Settings > Deploy keys (só leitura)
cat >> ~/.ssh/config <<'CFG'
Host github-calculadora
    HostName github.com
    User git
    IdentityFile ~/.ssh/calculadora_deploy
CFG
git clone git@github-calculadora:luizhenriquedevbr/miguelmaker-calculadora.git /var/www/calculadora
cd /var/www/calculadora
printf 'CALC_DB_PASSWORD=%s\nCALC_DB_ROOT_PASSWORD=%s\n' "$(openssl rand -hex 24)" "$(openssl rand -hex 24)" > /root/calculadora-deploy.env
chmod 600 /root/calculadora-deploy.env
cp api/.env.production.example api/.env.prod   # preencha ADMIN_EMAIL e ADMIN_PASSWORD
chmod 600 api/.env.prod
bash deploy.sh
docker exec calculadora-api php artisan key:generate --force
docker exec calculadora-api php artisan db:seed --force   # cria o login, a X2D e a configuração
# depois: apague ADMIN_PASSWORD do api/.env.prod
```

Deploys seguintes: `git push` aqui e `bash /var/www/calculadora/deploy.sh` no servidor.

## Energia (ANEEL)

A tarifa vem da API de dados abertos da ANEEL (tarifa vigente da distribuidora e bandeira tarifária). Na tela Energia, o botão de atualizar consulta a ANEEL e guarda o resultado. Se a ANEEL estiver fora do ar ou sem registro vigente, o último valor salvo continua valendo e a tela avisa. Também dá para informar uma tarifa final manual.

Tarifa final = (tarifa sem impostos + adicional da bandeira) / (1 - (ICMS + PIS + COFINS) / 100).

## Testes

```bash
docker compose exec api php artisan test   # API
cd app && npm test                         # app
```
