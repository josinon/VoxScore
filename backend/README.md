# VoxScore — API (NestJS)

Backend das Fases 1–6 do [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md): NestJS + PostgreSQL + TypeORM, health check, **JWT**, **OAuth Google** (mock em dev/CI), **`GET /users/me`**, seed do primeiro **ADMIN**, **CRUD de candidatos**, **votação por critérios**, **ranking 60/40** (com Swagger em `/api/v1/docs`), `POST /auth/dev/token` apenas quando ativado.

## Pré-requisitos

- Node.js 20+ (CI usa 22)
- Docker (opcional, para PostgreSQL local)

## PostgreSQL local

Na raiz do repositório:

```bash
docker compose up -d postgres pgadmin
```

- **PostgreSQL**: `localhost:5432` (utilizador `voxscore`, palavra-passe `voxscore`, base `voxscore`).
- **pgAdmin (web)**: [http://localhost:5050](http://localhost:5050) — email `admin@voxscore.local`, palavra-passe `admin` (apenas desenvolvimento).

No pgAdmin, registe um servidor com **Host** `postgres` (nome do serviço na rede Docker), **Port** `5432`, **Username** / **Password** iguais às variáveis do Postgres acima, **Maintenance database** `voxscore`.

No diretório `backend/`, copie variáveis de ambiente e ajuste se necessário:

```bash
cd backend
cp .env.example .env
```

O ficheiro [`.env.example`](./.env.example) documenta `DATABASE_URL`, `JWT_SECRET`, OAuth Google, mock OAuth, CORS, bootstrap do admin e `AUTH_DEV_TOKEN_ENABLED`.

## Primeiro administrador (Fase 2)

- No **primeiro arranque** da API, se **não existir nenhum** utilizador com `role = ADMIN`, é criado automaticamente um admin com:
  - `BOOTSTRAP_ADMIN_EMAIL` (predefinição: `admin@voxscore.local`)
  - `BOOTSTRAP_ADMIN_DISPLAY_NAME` (predefinição: `Administrator`)
- Se já existir **pelo menos um** `ADMIN`, o seed **não** cria nem altera utilizadores.
- O email de bootstrap tem de ser **livre** (constraint única em `users.email`); se já existir um registo com esse email e papel não-ADMIN, a criação falhará — nesse caso altere `BOOTSTRAP_ADMIN_EMAIL` ou limpe dados de desenvolvimento.

## Autenticação (Fase 3)

### JWT

- **`JWT_SECRET`** (obrigatório): segredo de assinatura; **nunca** em repositório público em produção. Rotação: emitir novo segredo, fazer deploy com overlap curto se necessário, invalidar tokens antigos (sem refresh token nesta fase, os clientes voltam a autenticar).
- **`JWT_EXPIRES_IN`**: tempo de vida do access token (predefinição `15m`, formato aceite pelo pacote `jsonwebtoken` / Nest JWT).

### OAuth Google (produção / staging)

1. Criar credenciais OAuth 2.0 (tipo *Web application*) na [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. **Authorized redirect URIs** deve incluir o valor exacto de **`GOOGLE_CALLBACK_URL`** (ex.: `http://localhost:3000/api/v1/auth/google/callback` em desenvolvimento com a API em `localhost:3000`).
3. Definir no `.env`:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
   - Opcional: **`OAUTH_FRONTEND_REDIRECT_URL`** — URL do SPA para onde o utilizador é enviado após login com **`#access_token=<JWT>`** no fragmento (o fragmento não é envido ao servidor nas navegações seguintes). Se **omitir**, o callback devolve **JSON** `{ "accessToken": "..." }` (útil para testes com `curl`).
4. Fluxo browser: **`GET /api/v1/auth/google`** → Google → **`GET /api/v1/auth/google/callback`** → redirect ou JSON conforme acima.

Sem as três variáveis Google preenchidas, **`GET /api/v1/auth/google`** e o callback respondem **404** (OAuth desligado).

### Mock OAuth (desenvolvimento e CI)

- **`POST /api/v1/auth/oauth/mock`** — corpo JSON `{ "email": "user@example.com", "displayName"?: "...", "photoUrl"?: "https://..." }`. Resposta `{ "accessToken": "..." }`.
- Só funciona com **`AUTH_GOOGLE_MOCK_ENABLED=true`**; caso contrário **404**. **Proibido** em produção.
- Primeiro email cria utilizador com **`role: PUBLIC`**; logins seguintes reutilizam o mesmo registo.

### Token de desenvolvimento (Fase 2, legado)

- **`POST /api/v1/auth/dev/token`** — corpo `{ "email": "..." }` para um utilizador **já existente**. Só com **`AUTH_DEV_TOKEN_ENABLED=true`**; caso contrário **404**. **Proibido** em produção.

### CORS

- **`CORS_ORIGINS`**: lista separada por vírgulas (ex.: `http://localhost:5173,http://127.0.0.1:5173`). Com valor definido, a API usa `credentials: true` e origem restrita a esses hosts. **Sem** variável, aplica-se política permissiva típica de desenvolvimento (ajustar antes de produção).

### Rotas protegidas

- **`GET /api/v1/users/me`** — `Authorization: Bearer <JWT>`.

### Candidatos (Fase 4)

- **`GET /api/v1/candidates`** — lista apenas candidatos com **`active: true`**, ordenados por `displayOrder` e nome.
- **`GET /api/v1/candidates/:id`** — detalhe; quem não é **ADMIN** obtém **404** se o candidato estiver inativo.
- **`POST /api/v1/candidates`**, **`PATCH /api/v1/candidates/:id`**, **`DELETE /api/v1/candidates/:id`** — apenas **ADMIN** (`403` para outros papéis). `DELETE` responde **204** sem corpo.

### Votação (Fase 5)

- **`POST /api/v1/candidates/:id/votes`** — utilizador autenticado com papel **`PUBLIC`** ou **`JUDGE`**. Corpo JSON `{ "criteriaScores": { ... } }` com **exactamente** as chaves do papel e valores **inteiros de 1 a 10**.
  - **`PUBLIC`** (4 chaves): `entertainment`, `emotion`, `likedTheMusic`, `wouldListenAgain`.
  - **`JUDGE`** (5 chaves): `vocalTechnique`, `interpretation`, `stagePresence`, `originality`, `composition`.
- **`PATCH /api/v1/candidates/:id/voting`** — apenas **ADMIN**; corpo `{ "open": boolean }` para abrir ou fechar a votação desse candidato (equivalente semântico a atualizar `votingOpen`).

#### Matriz de erros (votação)

| Situação | HTTP |
|----------|--------|
| Token em falta ou inválido | **401** |
| **`ADMIN`** submete voto | **403** |
| Candidato inexistente, inativo, ou detalhe negado a não-ADMIN | **404** (submissão de voto usa a mesma regra de “não encontrado” para inativo) |
| **`votingOpen === false`** | **403** |
| Utilizador desativado | **403** |
| Chaves de `criteriaScores` erradas para o papel (número ou nomes) | **400** |
| Nota não inteira ou fora de **1–10** | **400** |
| Segundo voto do mesmo utilizador no mesmo candidato | **409** |

### Ranking (Fase 6)

- **`GET /api/v1/ranking`** — qualquer utilizador autenticado (`PUBLIC`, `JUDGE`, `ADMIN`). Resposta `{ "schemaVersion": 1, "entries": [ ... ] }` (contrato versionado; incrementar `schemaVersion` só com mudanças documentadas).
- Inclui **apenas candidatos com `active: true`**, ordenados no leaderboard por `finalScore` (desc.), depois nome e id (empates no mesmo `rank` estilo competição).
- **Fórmula** (alinhada ao [README do produto](../README.md) §5): para cada votante, calcula-se a **média dos critérios** desse voto (4 ou 5 notas); depois a **média dessas médias** por grupo (**jurados** / **público**). Com **os dois grupos** com votos: `finalScore = 0.6 * média_jurados + 0.4 * média_público`. Com **só um grupo**: `finalScore` é a média desse grupo (o outro não entra como zero). **Sem votos**: `finalScore = 0`. Implementação e constantes: [`src/ranking/ranking-formula.ts`](./src/ranking/ranking-formula.ts).
- Cada entrada inclui médias por critério (`judgeCriteriaAverages` / `publicCriteriaAverages`) quando existirem votos nesse grupo, e `judgeCompositeAverage` / `publicCompositeAverage` (média das médias por voto). Valores numéricos arredondados a **4 casas decimais** no servidor.

### Tempo real (WebSocket)

- **`GET ws://<host>/api/v1/ws?token=<JWT>`** (ou `wss://` em HTTPS) — ligação **WebSocket** autenticada com o **mesmo JWT** que o REST (`token` na query; o browser não envia cabeçalhos custom na mão inicial).
- Mensagens JSON push (ex.: `{ "type": "candidates_changed" }`, `{ "type": "ranking_changed" }`) após alterações a candidatos (CRUD / `votingOpen`) ou após novo voto. O cliente deve refazer **`GET /candidates`** / **`GET /ranking`** conforme o evento.
- Implementação: [`src/realtime/`](./src/realtime/) (`WsAdapter` em [`main.ts`](./src/main.ts)).
- Testes: unitários [`src/realtime/realtime-hub.service.spec.ts`](./src/realtime/realtime-hub.service.spec.ts), [`src/realtime/realtime.gateway.spec.ts`](./src/realtime/realtime.gateway.spec.ts); e2e [`test/realtime.e2e-spec.ts`](./test/realtime.e2e-spec.ts) (com `DATABASE_URL`).

### Documentação OpenAPI

- Se **`SWAGGER_ENABLED`** não for `false`, a UI Swagger fica em **`http://localhost:<PORT>/api/v1/docs`** (botão **Authorize** para JWT Bearer).

### Verificação manual (T3.4)

Com credenciais Google reais e `OAUTH_FRONTEND_REDIRECT_URL` apontando para o SPA de staging, concluir login no browser e confirmar que `GET /users/me` devolve o perfil esperado.

## Migrações

Por defeito a API aplica migrações pendentes ao **arrancar** (`TYPEORM_MIGRATIONS_RUN` omitido ou `true`), para que `npm run start:dev` funcione sem correr `migration:run` antes. Defina `TYPEORM_MIGRATIONS_RUN=false` em Kubernetes com várias réplicas e use um **Job** para migrar (ver [`deploy/kubernetes/README.md`](../deploy/kubernetes/README.md)).

```bash
npm run migration:run
npm run migration:show
```

Reverter a última migração:

```bash
npm run migration:revert
```

## Executar a API

```bash
npm run start:dev
```

- Prefixo global: **`/api/v1`**
- Health (readiness com ping ao Postgres): **`GET /api/v1/health`** — responde **200** com `status: "ok"` e `info.database.status: "up"` quando o banco está acessível.

Orquestração (Kubernetes, Docker Compose da app, etc.): use **`GET /api/v1/health`** como readiness/liveness após o Postgres estar pronto. Guia de cluster: [`deploy/kubernetes/README.md`](../deploy/kubernetes/README.md).

## Testes (Fases 1 e 2)

| Script | Descrição |
|--------|-----------|
| `npm run test` | Testes unitários (Jest), incl. **T6.1–T6.2** (`ranking-formula.spec.ts`) |
| `npm run test:integration` | Fase 1 (T1.2–T1.4) + Fase 2 (T2.1) — exige `DATABASE_URL`; `test/integration/load-env.ts` define `JWT_SECRET` e `AUTH_DEV_TOKEN_ENABLED` por defeito para Jest |
| `npm run test:e2e` | T1.1 (health), T2.2–T2.3, T3.1–T3.3 (mock OAuth), **T4.1–T4.5 (candidatos)**, **T5.1–T5.6 (votação)**, **T6.3 (ranking)** — exige `DATABASE_URL`, migrações e env conforme CI |

Ordem sugerida com base de dados vazia:

```bash
npm run migration:run
npm run test:integration
npm run test:e2e
```

Sem `DATABASE_URL`, os testes de integração e e2e são **ignorados** (`describe.skip`) para não falharem em ambientes sem Postgres.

## CI

O workflow [`.github/workflows/backend-ci.yml`](../.github/workflows/backend-ci.yml) executa `migration:run`, testes e `build` contra PostgreSQL em serviço.
