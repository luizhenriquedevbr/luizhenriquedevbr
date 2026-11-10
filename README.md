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
- App: http://localhost:5184/calculadora/ (mesmo caminho da produção)
- O MySQL não expõe porta; só a rede interna do compose acessa.
- O usuário de login vem de `ADMIN_*` no `.env.docker` e é criado pelo `db:seed`.

## Produção

https://luizhenrique.dev.br/calculadora. Fica no repositório do site (`luizhenriquedevbr`), na pasta `calculadora/`, no droplet em `/var/www/luizhenriquedevbr/calculadora`. O `deploy.sh` do site faz o `git pull`, sobe o site e chama `calculadora/deploy.sh`.

- `docker-compose.prod.yml`: só o `app` (nginx) fica na rede `web` do Traefik, com a regra `Host(luizhenrique.dev.br) && PathPrefix(/calculadora)`, que vence a regra do site por ser mais longa. Ele serve o React em `/calculadora/` e repassa `/calculadora/api` para a API. API e MySQL ficam na rede interna, sem porta publicada.
- Senhas do banco: `/root/calculadora-deploy.env` (`CALC_DB_PASSWORD`, `CALC_DB_ROOT_PASSWORD`). Sem esse arquivo o deploy da calculadora para (o site já subiu antes).
- Configuração da API: `calculadora/api/.env.prod`, copiado de `api/.env.production.example` (`APP_DEBUG=false`).
- **Dados fora do git:** volume `calculadora_db_data` (peças, cadastros, tarifa), volume `calculadora_storage_data` (logs), `calculadora/api/.env.prod` e `/root/calculadora-deploy.env`. Numa migração de servidor, copie os quatro antes de desligar o antigo.

### Primeiro deploy (no servidor, depois do push)

```bash
cd /var/www/luizhenriquedevbr && git pull --ff-only origin main
printf 'CALC_DB_PASSWORD=%s\nCALC_DB_ROOT_PASSWORD=%s\n' "$(openssl rand -hex 24)" "$(openssl rand -hex 24)" > /root/calculadora-deploy.env
chmod 600 /root/calculadora-deploy.env
cp calculadora/api/.env.production.example calculadora/api/.env.prod   # preencha ADMIN_EMAIL e ADMIN_PASSWORD
chmod 600 calculadora/api/.env.prod
bash deploy.sh
docker exec calculadora-api php artisan key:generate --force
docker exec calculadora-api php artisan db:seed --force   # cria o login, a X2D e a configuração
# depois: apague a linha ADMIN_PASSWORD do calculadora/api/.env.prod
```

Deploys seguintes: `git push` e `bash /var/www/luizhenriquedevbr/deploy.sh` no servidor (sobe site e calculadora).

## Energia (ANEEL)

A tarifa vem da API de dados abertos da ANEEL (tarifa vigente da distribuidora e bandeira tarifária). Na tela Energia, o botão de atualizar consulta a ANEEL e guarda o resultado. Se a ANEEL estiver fora do ar ou sem registro vigente, o último valor salvo continua valendo e a tela avisa. Também dá para informar uma tarifa final manual.

Tarifa final = (tarifa sem impostos + adicional da bandeira) / (1 - (ICMS + PIS + COFINS) / 100).

## Testes

```bash
docker compose exec api php artisan test   # API
cd app && npm test                         # app
```
