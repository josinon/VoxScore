# VoxScore — Plano de implementação em fases

Este plano complementa o [DEVSPEC.md](./DEVSPEC.md). Cada fase tem **objetivo**, **entregas verificáveis**, **test cases** e **definition of done (DoD)**. Ao concluir a última fase, o sistema está **funcional de ponta a ponta** (API NestJS + PostgreSQL + SPA React em `frontend/`).

Convenções:

- **Testes automatizados**: preferência por testes de API (e2e da API ou supertest) e testes unitários nos serviços com regras de negócio (voto, ranking).
- **Testes manuais**: checklist explícito quando depender de navegador ou OAuth real.
- Uma fase só é **fechada** quando todos os test cases da fase passam e o DoD está cumprido.

### Ambiente de implantação (Kubernetes)

Backend e frontend destinam-se a **Kubernetes**: cargas separadas (API + assets da SPA), Ingress com TLS, Secrets para credenciais, readiness na API alinhado a `GET /api/v1/health`, e pipeline de build do frontend com URL pública da API. Ver [DEVSPEC §5.1](./DEVSPEC.md#51-implantacao-kubernetes) e [`deploy/kubernetes/README.md`](./deploy/kubernetes/README.md).

---

## Fase 1 — Fundação do backend e persistência

### Objetivo de implementação

Existir um serviço **NestJS** versionado no repositório, conectado a **PostgreSQL**, com **migrações** aplicáveis de forma reprodutível e modelo de dados mínimo (**User**, **Candidate**, **Vote**) alinhado ao DEVSPEC, **sem** ainda expor toda a API de negócio.

### Entregas verificáveis

- Projeto Nest (por exemplo `backend/` ou `api/`) com script `start:dev` documentado no README do pacote.
- Docker Compose **ou** instruções claras de `DATABASE_URL` / credenciais locais.
- Migrações criando tabelas com constraints: `User.email` único; `Vote` único `(userId, candidateId)`.
- Endpoint **`GET /health`** (ou `/api/v1/health`) retornando 200 quando DB está acessível.

### Test cases

| ID | Descrição | Tipo |
|----|-----------|------|
| T1.1 | Subir stack (DB + app); `GET /health` retorna 200. | Automatizado (e2e) ou manual com comando documentado |
| T1.2 | Rodar migrações em banco vazio; reaplicar não quebra (idempotência do fluxo de migrate). | Automatizado (CI) ou script |
| T1.3 | Inserir `User` duplicado por `email` falha no banco (constraint). | Teste de integração com DB de teste |
| T1.4 | Inserir dois `Vote` com mesmo `(userId, candidateId)` falha. | Teste de integração com DB de teste |

### Definition of done

- [x] CI (ou script local documentado) executa migrações e testes da Fase 1 sem erro — workflow [`.github/workflows/backend-ci.yml`](./.github/workflows/backend-ci.yml) (`migration:run` → `test` → `test:integration` → `test:e2e` → `build`); localmente seguir [`backend/README.md`](./backend/README.md).
- [x] Nenhuma credencial real commitada; uso de [`.env.example`](./backend/.env.example) — valores `voxscore`/`docker-compose` são **apenas para desenvolvimento local e CI**; produção deve usar Secrets (DEVSPEC §4.6).
- [x] Health check documentado para operação — [`backend/README.md`](./backend/README.md) e [`deploy/kubernetes/README.md`](./deploy/kubernetes/README.md) (`GET /api/v1/health`, probes).

**Nota de verificação:** T1.1–T1.4 só executam com `DATABASE_URL` definido; sem Postgres, integração e e2e usam `describe.skip` (exit 0). Confirmação plena dos test cases = CI verde ou `docker compose up` + `cp .env.example .env` + comandos no README do `backend/`.

---

## Fase 2 — Usuários, papéis e seed de administrador

### Objetivo de implementação

O domínio **User** com `role` (`PUBLIC` | `JUDGE` | `ADMIN`) persistido; existência garantida de **pelo menos um ADMIN** via seed ou variável de ambiente na primeira subida; endpoint **`GET /users/me`** protegido por JWT (JWT pode ser stub temporário **somente** se a Fase 3 ainda não estiver pronta — preferível completar Fase 3 antes de fechar Fase 2; se dividir, JWT mínimo emitido por endpoint de desenvolvimento documentado).

> **Nota de sequência**: na prática, **Fase 2 e 3** costumam ser desenvolvidas em sequência rápida. O DoD da Fase 2 exige **`GET /users/me` com JWT válido** após login (Fase 3).

### Entregas verificáveis

- Entidade/repositório `User` com campos do DEVSPEC (nome, foto URL, `role`, `disabled` opcional).
- Seed ou job de bootstrap criando admin inicial quando não existir admin.
- `GET /api/v1/users/me` retorna perfil do usuário autenticado incluindo `role`.

### Test cases

| ID | Descrição | Tipo |
|----|-----------|------|
| T2.1 | Banco vazio + seed: existe exatamente um usuário com `role = ADMIN` (ou política documentada). | Integração |
| T2.2 | Com JWT de um usuário `PUBLIC`, `GET /users/me` retorna `role: PUBLIC`. | API e2e |
| T2.3 | Sem `Authorization`, `GET /users/me` retorna **401**. | API e2e |

### Definition of done

- [x] Política de “primeiro admin” documentada (seed vs env) — [`backend/README.md`](./backend/README.md) secção «Primeiro administrador».
- [x] T2.1–T2.3 cobertos por testes (`test/integration/phase2.integration-spec.ts`, `test/users.e2e-spec.ts`); execução plena com Postgres + `JWT_SECRET` (CI no workflow).

---

## Fase 3 — Autenticação Google (ou mock) + JWT

### Objetivo de implementação

Fluxo de autenticação conforme DEVSPEC: **OAuth Google** tratado no backend (em desenvolvimento, **mock** aceitável se documentado e substituível por Google real); emissão de **JWT**; novo usuário recebe **`PUBLIC`** por padrão.

### Entregas verificáveis

- Rotas de auth alinhadas ao contrato (ex.: `GET /auth/google`, callback, resposta com token ou cookie httpOnly — uma opção escolhida e documentada).
- Guard JWT aplicável às rotas privadas.
- Primeiro login cria `User` com `PUBLIC`.

### Test cases

| ID | Descrição | Tipo |
|----|-----------|------|
| T3.1 | Simular callback OAuth (ou mock): resposta contém token válido decodificável com `sub`/`userId` coerente. | Integração / e2e |
| T3.2 | Primeiro login com email novo persiste usuário com `role = PUBLIC`. | Integração |
| T3.3 | Token inválido/expirado em rota protegida → **401**. | e2e |
| T3.4 | (Manual, se Google real) Login no navegador staging; `GET /users/me` retorna dados do Google. | Manual |

### Definition of done

- [x] Segredo JWT fora do código; rotação/expiração documentadas.
- [x] CORS configurável por env para origem do `frontend/`.
- [x] T3.1–T3.3 verdes; T3.4 se OAuth real estiver no escopo do ambiente.

---

## Fase 4 — Candidatos (CRUD admin + leitura autenticada)

### Objetivo de implementação

**CRUD de candidatos** apenas para `ADMIN`; **listagem e detalhe** para qualquer usuário autenticado; campos alinhados ao README (nome, música, gênero, bio, foto, links, `votingOpen`, `active`, ordem).

### Entregas verificáveis

- `GET /candidates`, `GET /candidates/:id` — autenticados.
- `POST/PATCH/DELETE /candidates` — somente `ADMIN`.
- Validação de DTOs (campos obrigatórios, URLs, limites).

### Test cases

| ID | Descrição | Tipo |
|----|-----------|------|
| T4.1 | `PUBLIC` autenticado: `GET /candidates` **200** e lista só candidatos ativos (política documentada se incluir inativos). | e2e |
| T4.2 | `PUBLIC`: `POST /candidates` → **403**. | e2e |
| T4.3 | `ADMIN`: cria candidato; `GET` por id retorna payload completo. | e2e |
| T4.4 | `ADMIN`: atualiza `votingOpen`; valor persiste. | e2e |
| T4.5 | DTO inválido (ex.: nota fora do lugar nesta fase — campo candidato inválido) → **400** com mensagem clara. | e2e |

### Definition of done

- [x] OpenAPI/Swagger com tag **candidatos** e DTOs documentados — UI em `/api/v1/docs` (desligar com `SWAGGER_ENABLED=false`).
- [x] T4.1–T4.5 — [`backend/test/candidates.e2e-spec.ts`](./backend/test/candidates.e2e-spec.ts).

---

## Fase 5 — Votação (regras de negócio no servidor)

### Objetivo de implementação

Submissão de voto com **critérios por papel** (4 para `PUBLIC`, 5 para `JUDGE`), notas **1–10**, **um voto por par** `(usuário, candidato)`; rejeição se `votingOpen === false`; **`ADMIN`** não vota (ou servidor rejeita — alinhar ao DEVSPEC: admin não vota).

### Entregas verificáveis

- `POST /api/v1/candidates/:id/votes` com corpo validado por `role`.
- `PATCH /candidates/:id/voting` — apenas `ADMIN`, body `{ open: boolean }`.

### Test cases

| ID | Descrição | Tipo |
|----|-----------|------|
| T5.1 | `PUBLIC`, candidato aberto, 4 critérios válidos → **201**; segundo POST mesmo par → **409** (ou código acordado de conflito). | e2e |
| T5.2 | `PUBLIC` enviando 5 critérios (jurado) → **400**. | e2e |
| T5.3 | `JUDGE` enviando 4 critérios → **400**. | e2e |
| T5.4 | Candidato `votingOpen: false` → **403** (documentado no README da API). | e2e |
| T5.5 | `ADMIN` tenta votar → **403** (se essa for a regra fixada). | e2e |
| T5.6 | Nota 0 ou 11 → **400**. | e2e |

### Definition of done

- [x] Matriz de erros documentada (tabela curta na doc da API — [`backend/README.md`](./backend/README.md)).
- [x] T5.1–T5.6 verdes — [`backend/test/voting.e2e-spec.ts`](./backend/test/voting.e2e-spec.ts).

---

## Fase 6 — Ranking (ponderação 60% jurados / 40% público)

### Objetivo de implementação

Endpoint **`GET /ranking`** autenticado retorna leaderboard **determinístico**, com fórmula **idêntica** à documentada no README/DEVSPEC; agregações por critério conforme produto (mínimo: posição e score final).

### Entregas verificáveis

- Serviço de ranking com testes unitários da fórmula em dataset fixo (fixtures).
- Contrato JSON estável (versionar com cuidado).

### Test cases

| ID | Descrição | Tipo |
|----|-----------|------|
| T6.1 | Fixture com N votos públicos e M votos jurados: score final coincide com valor esperado calculado offline (planilha ou teste dourado). | Unitário |
| T6.2 | Candidato sem votos de um dos grupos: comportamento documentado (ex.: só média do grupo existente ou zero ponderado — **deve** estar especificado e testado). | Unitário |
| T6.3 | `GET /api/v1/ranking` sem auth → **401**; com `PUBLIC` → **200**. | e2e |

### Definition of done

- [x] Fórmula 60/40 referenciada no código (comentário ou doc) e reproduzível — [`backend/src/ranking/ranking-formula.ts`](./backend/src/ranking/ranking-formula.ts), [`backend/README.md`](./backend/README.md) §Ranking.
- [x] T6.1–T6.3 verdes — unitário [`backend/src/ranking/ranking-formula.spec.ts`](./backend/src/ranking/ranking-formula.spec.ts); e2e [`backend/test/ranking.e2e-spec.ts`](./backend/test/ranking.e2e-spec.ts).

---

## Fase 7 — Frontend: integração API, auth e roteamento por `role`

### Objetivo de implementação

A SPA em **`frontend/`** obtém token/sessão, chama **`GET /users/me`**, persiste sessão de forma segura (preferência: **httpOnly cookie** se API assim entregar; se Bearer em memória/localStorage, risco documentado); **roteamento** separando área eleitor (`PUBLIC`/`JUDGE`) e área **`ADMIN`**; sem “escolher perfil” manual.

### Entregas verificáveis

- Cliente HTTP centralizado (base URL por env `VITE_*`).
- Fluxo login → logout; menu de usuário com foto/nome quando disponíveis.
- Guarda de rota: `ADMIN` acessa painel; não-admin não acessa rotas admin.

### Test cases

| ID | Descrição | Tipo |
|----|-----------|------|
| T7.1 | Login; `GET /api/v1/users/me` é chamado; UI reflete `role` — Playwright [`frontend/e2e/auth.spec.ts`](./frontend/e2e/auth.spec.ts). | e2e |
| T7.2 | `PUBLIC` navega para `/admin` → redirecionamento para página de acesso negado. | e2e |
| T7.3 | Logout limpa `sessionStorage`; refresh em `/login`; `/votacao` sem sessão → `/login`. | e2e |

### Definition of done

- [x] `.env.example` no frontend com variáveis necessárias — [`frontend/.env.example`](./frontend/.env.example).
- [x] T7.1–T7.3 verdes — `npm run test:e2e` em [`frontend/`](./frontend/) (Playwright).

---

## Fase 8 — Frontend: jornada do eleitor (candidatos, voto, ranking)

### Objetivo de implementação

Substituir mocks locais pela **API real**: listagem e detalhe de candidatos, fluxo de votação com critérios corretos por papel, confirmação pós-voto, **ranking** consumindo `GET /ranking`; polling ou SSE/WebSocket se já existir no backend (senão **polling** documentado com intervalo razoável).

### Entregas verificáveis

- Telas conectadas aos endpoints; estados de carregamento e erro.
- Bloqueio de UI alinhado ao backend (candidato fechado, já votou).

### Test cases

| ID | Descrição | Tipo |
|----|-----------|------|
| T8.1 | `PUBLIC`: lista candidatos; abre detalhe; envia 4 critérios; vê confirmação. | E2E UI ou manual |
| T8.2 | Após votar, tentar votar de novo → mensagem de conflito alinhada ao backend. | E2E UI ou manual |
| T8.3 | Ranking exibe top 3 e reflete mudança após novo voto (após refresh/poll). | Manual ou E2E |
| T8.4 | Viewport estreita (375px): fluxo de votação utilizável sem overflow crítico. | Manual |

### Definition of done

- [ ] Nenhum dado sensível de produção em fixtures do repo.
- [ ] T8.1–T8.4 verdes.

---

## Fase 9 — Frontend: área administrativa e gestão de usuários

### Objetivo de implementação

Telas admin na mesma SPA: **CRUD candidatos**, **abrir/fechar votação** por candidato, **listar usuários** e **`PATCH` de `role`**, com confirmações para ações críticas; regra do backend “não remover último ADMIN” refletida na UI (mensagem amigável).

### Entregas verificáveis

- Integração com `PATCH /users/:id`, `PATCH /candidates/:id/voting`, CRUD candidatos.
- Indicadores visuais de votação aberta/fechada (README).

### Test cases

| ID | Descrição | Tipo |
|----|-----------|------|
| T9.1 | `ADMIN`: cria/edita/remove (ou desativa) candidato; mudança aparece na lista do eleitor após refresh. | Manual ou E2E |
| T9.2 | `ADMIN`: alterna `votingOpen`; eleitor vê bloqueio/liberação coerente. | Manual ou E2E |
| T9.3 | `ADMIN`: promove usuário a `JUDGE`; login como esse usuário mostra 5 critérios. | Manual ou E2E |
| T9.4 | `PUBLIC`: chamadas admin via DevTools falham (403 no cliente e no servidor). | Manual |

### Definition of done

- [ ] Matriz de permissões da Fase 9 documentada em 1 página no README do monorepo ou DEVSPEC (link).
- [ ] T9.1–T9.4 verdes.

---

## Fase 10 — Hardening MVP (segurança, observabilidade, smoke final)

### Objetivo de implementação

Sistema **pronto para demonstração** ou deploy inicial: rate limit nas rotas sensíveis, logs estruturados mínimos, health check operacional, **build de produção** do frontend e backend passando, **smoke** automatizado ou checklist único cobrindo o fluxo README (adaptado: sem “seleção de perfil”, sim `role` do servidor).

### Entregas verificáveis

- Rate limit em `POST .../votes` e rotas de auth (conforme DEVSPEC).
- `README.md` raiz atualizado: como subir tudo, URLs, variáveis.
- Documentação de **implantação em Kubernetes** alinhada ao DEVSPEC §5.1 (probes, Secrets/ConfigMaps, Job de migração, Ingress e build do frontend); ver [`deploy/kubernetes/README.md`](./deploy/kubernetes/README.md).
- Smoke script ou job CI (opcional mas recomendado).

### Test cases

| ID | Descrição | Tipo |
|----|-----------|------|
| T10.1 | Smoke: login → `users/me` → listar candidatos → (como admin) abrir votação → (como público) votar → ranking atualizado. | Script e2e ou checklist manual único |
| T10.2 | Build `pnpm build` / `npm run build` (frontend + backend) sem erro. | CI |
| T10.3 | Tentativas repetidas de voto (abuse) respeitam rate limit **429** após limiar. | e2e ou carga leve |

### Definition of done

- [ ] T10.1–T10.3 verdes.
- [ ] Stakeholder consegue reproduzir o demo seguindo apenas o README.

---

## Mapa de rastreabilidade (MVP DEVSPEC §6)

| Critério DEVSPEC §6 | Fases principais |
|---------------------|------------------|
| Cadastro/login Google, usuário `PUBLIC` por padrão | 3, 7 |
| Admin gerencia candidatos e abre/fecha votação | 4, 9 |
| Voto com critérios por papel; servidor rejeita inválidos | 5, 8 |
| Ranking 60/40 para todos autenticados | 6, 8 |
| Admin altera `role` | 4 (API users), 9 |

---

## Ordem sugerida e paralelismo

- **Sequencial obrigatório**: 1 → 2/3 → 4 → 5 → 6 antes de integrar votos/ranking com confiança no frontend de dados reais.
- **Paralelo possível**: após Fase 4, pode-se iniciar **Fase 7** em paralelo à 5–6 usando contratos mockados, mas o **DoD da Fase 8** exige backend Fase 5–6 concluídos.

Ao terminar a **Fase 10**, o produto atende ao MVP descrito no DEVSPEC e o fluxo ponta a ponta está **funcional e verificável**.
