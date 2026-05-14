# VoxScore — Especificação de desenvolvimento (devspec)

Documento de referência para implementação do produto descrito no [README.md](./README.md), com **um único cliente web**: aplicação **React.js responsiva** (votação e cadastro do público em qualquer dispositivo, área administrativa no mesmo app com layouts adaptados a telas grandes) e **API NestJS**. O **ambiente de implantação de referência** para API e cliente é **Kubernetes** (ver [§5.1](#51-implantacao-kubernetes) e [`deploy/kubernetes/README.md`](./deploy/kubernetes/README.md)).

O cliente reside em [`frontend/`](./frontend/) como SPA **Vite + React**, alinhado ao restante deste documento. **Não há pacotes separados** para “mobile” e “web desktop”: mobile e desktop são **as mesmas rotas e componentes**, com CSS/layout responsivo (breakpoints, navegação condensada em telas pequenas, tabelas e painéis em telas largas para `ADMIN`).

---

## 0. Cliente frontend — pacote `frontend/`

### 0.1 Stack e organização

Implementação prevista como SPA **Vite 6 + React 18**, **Tailwind CSS 4**, **Radix UI**, ícones MUI, **motion** e utilitários conforme [`frontend/package.json`](./frontend/package.json). Ponto de entrada da UI: [`frontend/src/app/App.tsx`](./frontend/src/app/App.tsx). Tipos compartilhados em [`frontend/src/app/types.ts`](./frontend/src/app/types.ts) (`Artist`, `Vote`, `ArtistScore`, etc.).

### 0.2 Comportamento e integração

| Área | Especificação |
|------|----------------|
| Dados | Candidatos, votos e ranking vindos da **API NestJS**; ranking calculado preferencialmente no servidor. |
| Login | Fluxo OAuth Google concluído no backend; sessão do cliente via **JWT** (ou equivalente). |
| Papel do usuário | Definido **somente no servidor** (`role` em token ou `GET /users/me`); sem seleção manual de perfil no cliente. |
| Administração | Gestão de candidatos, usuários e abertura/fechamento de votação na **mesma aplicação**, em rotas ou seções com UI otimizada para viewport largo; fora do fluxo principal de `PUBLIC` / `JUDGE`. |
| Critérios | Labels dos critérios podem permanecer no app (como em `JUDGE_CRITERIA` / `PUBLIC_CRITERIA` em `App.tsx`) ou serem fornecidos pela API, conforme decisão de produto. |
| Responsividade | Um código-base: mesma build para telefone, tablet e desktop; testar fluxos críticos em larguras estreitas e largas. |

### 0.3 Diretrizes de implementação

1. **Cliente HTTP** (fetch/axios), armazenamento seguro de token e contexto de autenticação.
2. Consumir **API NestJS** para candidatos, votos e ranking.
3. Após login, usar **`GET /users/me`** (ou equivalente) para `role`, critérios aplicáveis e navegação.
4. Usuários **`ADMIN`**: acesso às telas administrativas no mesmo app (rotas protegidas); em viewports pequenas, manter usabilidade mínima ou orientar uso em tela maior, conforme produto.
5. Opcional: **PWA** (manifest + service worker) sobre o mesmo Vite para experiência instalável em dispositivos móveis.

---

## 1. Objetivos e escopo

| Meta | Descrição |
|------|-----------|
| Cliente único responsivo | App em [`frontend/`](./frontend/) (Vite/React): login, candidatos, votação por critérios (conforme perfil), ranking; mesma base para uso em celular e desktop. |
| Gestão no mesmo app | CRUD de candidatos, gestão de usuários (incluindo alteração de papel) e operação do evento em rotas/componentes administrativos, com layout adequado a telas grandes. |
| Regras de negócio | Manter critérios, ponderação **60% jurados / 40% público**, controle de abertura de votação por candidato e uma avaliação por usuário/candidato onde aplicável. |

Fora do escopo inicial (pode entrar em fases posteriores): **aplicação cliente separada** só para admin ou só para mobile; apps **nativos** store-ready quando o foco for primeiro o cliente web responsivo; pagamentos; multi-evento com tenants isolados; auditoria formal para disputas judiciais.

---

## 2. Perfis de usuário e política de cadastro

### 2.1 Papéis (`role`)

| Papel | Código sugerido | Uso principal |
|-------|-----------------|---------------|
| Público | `PUBLIC` | Auto cadastro no cliente; critérios de preferência (4). |
| Jurado | `JUDGE` | Critérios técnicos (5); atribuído pelo administrador. |
| Administrador | `ADMIN` | Abrir/fechar votação por candidato; gestão de candidatos e usuários; ranking operacional. |

### 2.2 Cadastro e promoção de papel

- **Cliente**: fluxo de auto cadastro (e login). Todo usuário criado por esse fluxo recebe **`PUBLIC`** por padrão.
- **Alteração de papel**: apenas **`ADMIN`** (via área administrativa no mesmo app) pode alterar `PUBLIC` ↔ `JUDGE` ou conceder `ADMIN`. Recomenda-se exigir pelo menos um `ADMIN` inicial via seed/migração ou variável de ambiente na primeira instalação, para não haver “sistema sem admin”.
- **Autenticação**: README prevê login com Google (simulado ou real). A API deve aceitar OAuth Google no backend e emitir sessão própria (JWT ou similar) para o cliente.

### 2.3 Matriz de permissões (resumo)

| Ação | PUBLIC | JUDGE | ADMIN |
|------|--------|-------|-------|
| Ver candidatos / ranking | ✓ | ✓ | ✓ |
| Votar (critérios do papel) | ✓ se votação aberta | ✓ se aberta | — |
| `GET /api/v1/users` (listar utilizadores) | — | — | ✓ |
| `PATCH /api/v1/users/:id` (`role`, `disabled`) | — | — | ✓ |
| CRUD candidatos (`POST`/`PATCH`/`DELETE /candidates`) | — | — | ✓ |
| Abrir/fechar votação (`PATCH /candidates/:id/voting`) | — | — | ✓ |

**Último administrador:** o backend recusa despromover ou desativar o único `ADMIN` ativo (`403` — ver [`backend/README.md`](./backend/README.md) e `UsersService`).

Detalhe das rotas: [`backend/README.md`](./backend/README.md) (secções Candidatos, Votação, Utilizadores).

## 3. Aplicação React responsiva

### 3.1 Votação e ranking (`PUBLIC` / `JUDGE`)

- Onboarding, login (Google), logout, exibição do perfil (foto/nome conforme provedor).
- Listagem e detalhe do candidato (nome, música, gênero, foto, bio, redes).
- Fluxo de votação: critérios conforme `role` (4 para público, 5 para jurado), notas 1–10, confirmação; bloqueio se candidato fechado ou já votou (regra de unicidade definida no backend).
- Ranking em tempo quase real (polling ou WebSocket/SSE — ver backend).
- **Não** expor telas de gestão de outros usuários nem CRUD de candidatos nesse fluxo (apenas consumo); essas capacidades ficam atrás de guardas de rota e UI de admin.

### 3.2 Área administrativa (`ADMIN`)

- Mesma SPA: rotas ou módulos dedicados (ex.: componentes em `frontend/src/app/components/admin/`), consumindo a **API NestJS**.
- **Autenticação**: mesmo provedor Google + sessão API; restrição de rota a `ADMIN`.
- **Candidatos**: criar, editar, listar, (opcional) desativar; campos alinhados ao README + URLs de mídia (foto) e redes.
- **Usuários**: listar usuários, alterar `role` (`PUBLIC` | `JUDGE` | `ADMIN`), opcionalmente bloquear conta.
- **Operação do evento**: por candidato, alternar **votação aberta/fechada**; indicadores visuais espelham estado retornado pela API.
- **Ranking**: visualização para operação (consistente com o restante do app).
- **Layout**: priorizar tabelas, formulários e filtros em breakpoints largos; em telas pequenas, usar padrões adaptados (cards empilhados, drawers, scroll horizontal controlado em tabelas) para manter acesso funcional.

### 3.3 Estrutura de UI em `frontend/`

Organizar telas em `frontend/src/app/components/` — por exemplo `VotingHeader`, `ArtistCard`, `ArtistDetails`, `CriteriaVoting`, `VoteConfirmation`, `Ranking`, `UserMenu` — com dados vindos da **API** e **guardas de rota** por `role`. Componentes administrativos (ex.: `AdminDashboard`, gestão de candidatos/usuários/votação) compartilham autenticação e design system com o restante do app.

### 3.4 UX notas

- Alinhado ao README: gradientes roxo/rosa, animações leves, navegação simples.
- Fluxo lógico: Login → (papel definido no servidor) → Votação / Ranking ou Admin — **sem** “escolher perfil” manual no cliente; roteamento condicional com base em `role` retornado pela API.

---

## 4. Backend NestJS

### 4.1 Stack sugerida

- **NestJS** (HTTP), **TypeORM** ou **Prisma** com PostgreSQL (recomendado para consistência e relatórios).
- **Passport**: estratégia Google OAuth2 + estratégia JWT para rotas internas.
- **Validação**: `class-validator` / `class-transformer` nos DTOs.
- **Tempo real (opcional fase 1)**: `@nestjs/websockets` + adapter Redis para ranking; alternativa mínima — polling no cliente sobre endpoints de ranking.

### 4.2 Módulos sugeridos

| Módulo | Função |
|--------|--------|
| `AuthModule` | OAuth Google, callback, emissão de JWT (access + refresh opcional), guards. |
| `UsersModule` | CRUD limitado; listagem e patch de `role` só `ADMIN`; perfil do usuário logado. |
| `CandidatesModule` | CRUD admin; leitura autenticada para eleitores. |
| `VotingModule` | Estado aberto/fechado por candidato; submissão de votos; validação de critérios por `role`; impedir duplicidade. |
| `RankingModule` | Agregações: médias por critério, score ponderado 60/40, leaderboard. |

### 4.3 Modelo de dados (conceitual)

- **User**: id, email único, nome, foto URL, `role`, timestamps, opcional `disabled`.
- **Candidate**: id, nome, música, gênero, bio, foto URL, links (Instagram, YouTube), `votingOpen` boolean, ordem de exibição, `active`.
- **Vote**: id, `userId`, `candidateId`, critérios com notas 1–10 (JSON normalizado ou colunas por critério), `createdAt`; **constraint** única `(userId, candidateId)` para um voto por par.
- **Critérios**: podem ser enums no código + validação no serviço, ou tabelas de configuração se precisar mudar sem deploy.

### 4.4 Regras de votação (servidor)

- Só aceitar votos se `candidate.votingOpen === true` e usuário autenticado.
- Validar conjunto de critérios conforme `user.role` (4 vs 5 campos).
- Recalcular ranking de forma determinística (mesma fórmula que o README).

### 4.5 API (REST) — esboço

Prefixo `/api/v1` (exemplo).

**Auth**

- `GET /auth/google` — inicia OAuth (se usar redirect).
- `GET /auth/google/callback` — callback; retorna tokens ou seta cookie httpOnly (decisão de time).
- `POST /auth/refresh` — se usar refresh token.

**Usuários** (JWT)

- `GET /users/me`
- `GET /users` — `ADMIN`
- `PATCH /users/:id` — `ADMIN` (body: `{ role }`, etc.)

**Candidatos**

- `GET /candidates` — autenticado
- `GET /candidates/:id` — autenticado
- `POST|PATCH|DELETE /candidates` — `ADMIN`

**Votação**

- `PATCH /candidates/:id/voting` — `ADMIN` body `{ open: boolean }`
- `POST /candidates/:id/votes` — autenticado; body com notas por critério

**Ranking**

- `GET /ranking` — autenticado; query opcional para filtrar

### 4.6 Segurança

- JWT em header `Authorization: Bearer`, tempo de vida curto no access token.
- HTTPS em produção; CORS restrito ao(s) origin(s) do `frontend/` (no cluster, alinhar ao **hostname** exposto pelo Ingress do frontend).
- Segredos (`DATABASE_URL`, chaves OAuth, segredo de assinatura JWT) apenas via **Kubernetes Secrets** (ou gestor equivalente); nunca em ConfigMap público nem na imagem.
- Rate limit em `POST .../votes` e em login.
- Admin não pode remover o último `ADMIN` sem substituto (regra de negócio).

### 4.7 Observabilidade

- Logs estruturados; métricas básicas (latência, 4xx/5xx); health check para orquestração (**readiness** no Kubernetes deve refletir dependências críticas, p.ex. PostgreSQL — ver [`GET /api/v1/health`](./backend/README.md) na API).

---

## 5. Integração entre camadas

```
frontend/ (Vite + React, responsivo)  ──HTTPS──►  NestJS API
                                                    │
                                              PostgreSQL
```

- O cliente em **`frontend/`** atende **navegadores em qualquer tamanho de tela**; alternativas de empacotamento devem manter contratos com a mesma API.
- Contratos: OpenAPI/Swagger gerado pelo Nest (`@nestjs/swagger`) recomendado para evitar divergência entre módulos da mesma SPA.

### 5.1 Implantação (Kubernetes)

Pressuposto: **backend** e **frontend** são **cargas distintas** no cluster (ou frontend servido fora do cluster por CDN, desde que o contrato CORS/OAuth permaneça coerente).

| Área | Orientação |
|------|-------------|
| **API (Nest)** | `Deployment` + `Service` (ClusterIP ou conforme mesh); **Ingress** (ou gateway) com TLS para expor `/api/v1`. |
| **Readiness / liveness** | Readiness em `GET /api/v1/health` garante que o Pod não recebe tráfego sem PostgreSQL acessível; liveness pode reutilizar o mesmo endpoint ou um check mais barato se no futuro o readiness incluir dependências opcionais. |
| **Migrações** | Executar `migration:run` em **Job** Kubernetes (ou init hook do chart) **antes** de novas versões com mudança de schema; evitar múltiplas réplicas a correr migrações em simultâneo sem bloqueio. |
| **PostgreSQL** | Preferir serviço **gerido** fora do namespace da API; se in-cluster, operar com operador/StatefulSet dedicado, não embutido na imagem da API. |
| **Frontend (SPA)** | Imagem **nginx** (ou equivalente) servindo o `dist` do Vite, ou assets em object storage + Ingress; variáveis `VITE_*` da URL da API são **bake-time** — o pipeline de build deve receber a URL pública da API do ambiente alvo. |
| **Rede e segurança** | `NetworkPolicy` opcional para restringir tráfego à API apenas a partir do Ingress; CORS e redirects OAuth Google devem usar URLs públicas finais (Ingress), não Service internos. |

Detalhe operacional e exemplos de probes: [`deploy/kubernetes/README.md`](./deploy/kubernetes/README.md).

---

## 6. Critérios de aceite (MVP)

1. Usuário se cadastra/loga via Google no cliente e permanece `PUBLIC` até um admin alterar.
2. Admin gerencia candidatos na mesma aplicação (área admin) e abre/fecha votação por candidato.
3. Público e jurado votam apenas com seus critérios; servidor rejeita combinações inválidas e candidatos fechados.
4. Ranking reflete a ponderação 60/40 e está disponível para todos os perfis autenticados.
5. Admin altera `role` entre público, jurado e administrador pelo painel no mesmo app.

---

## 7. Próximos passos de implementação sugeridos

1. Repositório Nest + PostgreSQL + schema inicial + seed de admin.
2. Auth Google + JWT + guards por `role`.
3. CRUD candidatos + flag `votingOpen`.
4. Endpoint de votos + índices únicos + ranking.
5. Cliente **`frontend/`**: camada HTTP, auth e tipos alinhados ao OpenAPI; integração com candidatos, votos e ranking; navegação baseada em `users/me` e `role`.
6. Rotas e UI administrativas na mesma SPA (proteção por `ADMIN`); responsividade para admin em telas pequenas e grandes.
7. Garantir que fluxos de eleitor não dependam de telas administrativas em produção; compartilhar componentes e tokens de design entre votação e admin.

O pacote **`frontend/`** é a base **web responsiva** (Vite + React). Evoluir para **PWA** ou app **nativo** (React Native/Flutter) é decisão de produto independente da API. Tempo real na jornada do eleitor (lista de candidatos e ranking): **WebSocket** na API (`/api/v1/ws?token=<JWT>`), com reconexão no cliente; ver [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) Fase 8.
