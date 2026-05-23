# Teste de carga — submissão de votos (VoxScore)

Este diretório mede **quantos votos simultâneos** a stack aguenta (API NestJS + PostgreSQL + Ingress), em especial em **produção** (`https://megadance.lab6.cloud` ou o vosso host).

## O que limita o resultado

| Fator | Valor típico no projeto | Efeito no teste |
|--------|-------------------------|-----------------|
| **Rate limit por IP** | `THROTTLE_VOTES_LIMIT=30` / `THROTTLE_VOTES_TTL_MS=60000` | Um único IP (um `k6` num portátil) **não passa de ~30 votos/min**, mesmo que o cluster aguente mais. |
| **1 voto por utilizador/candidato** | Índice único na BD | Precisa de **N tokens = N utilizadores** distintos para N votos válidos. |
| **Réplicas da API** | 2 pods (`deploy/kubernetes/base`) | Escala horizontal; o gargalo costuma ser **Postgres** ou **limite de CPU** (1 CPU / pod). |
| **JWT em produção** | `AUTH_DEV_TOKEN_ENABLED=false`, mock OAuth desligado | Tokens têm de vir de utilizadores reais na BD ou de um **JWT assinado com o mesmo `JWT_SECRET`** (janela de teste controlada). |

Para saber o **teto real** do sistema:

1. Aumentar temporariamente `THROTTLE_VOTES_LIMIT` no ConfigMap **ou**
2. Correr k6 a partir de **vários IPs** (várias VMs, k6 Cloud), **ou**
3. Combinar ambos.

## Pré-requisitos

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) instalado (`k6 version`)
- Node.js 18+ (scripts `prepare-*.mjs`)
- Janela acordada com a equipa (produção com utilizadores reais)
- Monitorização durante o teste: `kubectl -n voxscore top pods`, logs da API, métricas do Postgres

## Cenário A — Homologação / staging (recomendado antes de produção)

Com `AUTH_GOOGLE_MOCK_ENABLED=true` (overlay `local` ou staging dedicado):

```bash
cd load-tests

# 1) Tokens (cria utilizadores via mock OAuth)
node prepare-tokens.mjs mock --base-url https://SEU_STAGING --count 500

# 2) Candidato com votação aberta (login ADMIN no browser, copiar JWT)
export ADMIN_TOKEN='eyJhbG...'
node prepare-candidate.mjs --base-url https://SEU_STAGING

# 3) Carga (o k6 não lê `export` do shell — use --env-file ou -e com valor)
cp load-test.env.example load-test.env
# Edite load-test.env: BASE_URL e CANDIDATE_ID=$(cat candidate-id.txt)
mkdir -p results
./run-load-test.sh
# ou: k6 run --env-file=load-test.env votes-load.js

# 4) Limpeza
psql "$DATABASE_URL" -f cleanup-load-test.sql
```

## Cenário B — Produção (controlado)

**Não** active `AUTH_DEV_TOKEN_ENABLED` nem mock OAuth em produção.

### 1. Preparar utilizadores na base

```bash
cd load-tests
node generate-seed-sql.mjs 1000 > seed-load-users.sql
# Aplicar na BD de produção (janela de manutenção):
psql "$DATABASE_URL" -f seed-load-users.sql
```

### 2. Gerar JWTs (mesmo segredo que a API)

```bash
# Exemplo: secret do cluster
export JWT_SECRET="$(kubectl -n voxscore get secret voxscore-api -o jsonpath='{.data.JWT_SECRET}' | base64 -d)"

node prepare-tokens.mjs jwt --secret "$JWT_SECRET" --ids user-ids.txt
```

### 3. Candidato de teste e throttle

```bash
export ADMIN_TOKEN='...'   # JWT ADMIN obtido após login Google real
node prepare-candidate.mjs --base-url https://megadance.lab6.cloud

# Opcional: subir limite durante o teste (reverter depois)
kubectl -n voxscore edit configmap voxscore-api-config
#   THROTTLE_VOTES_LIMIT: "5000"
#   THROTTLE_VOTES_TTL_MS: "60000"
kubectl -n voxscore rollout restart deployment/voxscore-api
```

### 4. Executar k6

```bash
# Opção A — ficheiro .env para o k6
cp load-test.env.example load-test.env
# BASE_URL=https://megadance.lab6.cloud
# CANDIDATE_ID=<uuid>
k6 run --env-file=load-test.env --out json=results/run.json votes-load.js

# Opção B — flags com valor explícito (não basta `export` no bash)
k6 run \
  -e BASE_URL=https://megadance.lab6.cloud \
  -e CANDIDATE_ID="$(cat candidate-id.txt)" \
  --out json=results/run.json \
  votes-load.js
```

O resumo inclui **contagem por código HTTP** (201, 409, 401, …), **votos novos/s** e **pedidos/s**.

### 5. Ajustar cenário de carga

No `load-test.env` (ou flags `-e`):

- **`SCENARIO=unique`** (predefinição) — executor `per-vu-iterations` (1 POST por VU; **não** usar `return` em loop — isso gerava milhões de iterações vazias).
- **`SCENARIO=stress`** — VUs em loop; útil só para pressionar HTTP (gera muitos 409).
- **`MAX_VUS=300`** — teto de utilizadores simultâneos (≤ `tokens.length`).

```bash
k6 run --env-file=load-test.env -e MAX_VUS=500 votes-load.js
```

### 6. Limpeza

```bash
psql "$DATABASE_URL" -f cleanup-load-test.sql
# Apagar candidato de teste no painel ADMIN ou via API DELETE
# Restaurar THROTTLE_* no ConfigMap se alterou
```

## Como interpretar “quantos votos simultâneos”

- **`HTTP 201` / `vote_created`** — votos novos gravados (métrica principal).
- **`MAX_VUS`** com **`SCENARIO=unique`** — quantos utilizadores votaram ao mesmo tempo com sucesso (201).
- **`Votos novos / s`** no resumo — throughput de votos válidos.
- **`Pedidos/s`** — carga HTTP total (em `stress` inclui 409 repetidos).
- Muitos **409** em `unique` → utilizadores já tinham votado; candidato novo ou `cleanup-load-test.sql`.
- Muitos **429** → throttle por IP; subir `THROTTLE_*` ou vários IPs de carga.
- **5xx** / p95 alto → Postgres, pool de conexões ou CPU da API.

Relatório HTML opcional:

```bash
k6 run ... --out web-dashboard=export=results/dashboard.html
```

## Segurança

- Não commitar `tokens.json` nem `JWT_SECRET` (já estão no `.gitignore`).
- Preferir emails `*@voxscore.loadtest` e candidato claramente marcado como teste.
- Evitar horários com votação real aberta no mesmo candidato.
- Documentar alterações ao ConfigMap e revertê-las após o teste.

## Referências no código

- Endpoint: `POST /api/v1/candidates/:id/votes` — `backend/src/voting/voting.controller.ts`
- Throttle: `backend/src/common/throttle/throttle-env.ts` (`THROTTLE_VOTES_*`)
- Deploy: 2 réplicas API — `deploy/kubernetes/base/deployment-api.yaml`
