# VoxScore — Especificação de desenvolvimento (devspec)

Documento de referência para implementação do produto descrito no [README.md](./README.md), com **app mobile** para votação e cadastro do público, **painel web desktop** para gestão de candidatos e usuários, e **API NestJS**.

O cliente mobile é especificado para residir em [`mobile/`](./mobile/) como SPA **Vite + React**, alinhado ao restante deste documento.

---

## 0. Cliente mobile — pacote `mobile/`

### 0.1 Stack e organização

Implementação prevista como SPA **Vite 6 + React 18**, **Tailwind CSS 4**, **Radix UI**, ícones MUI, **motion** e utilitários conforme [`mobile/package.json`](./mobile/package.json). Ponto de entrada da UI: [`mobile/src/app/App.tsx`](./mobile/src/app/App.tsx). Tipos compartilhados em [`mobile/src/app/types.ts`](./mobile/src/app/types.ts) (`Artist`, `Vote`, `ArtistScore`, etc.).

### 0.2 Comportamento e integração

| Área | Especificação |
|------|----------------|
| Dados | Candidatos, votos e ranking vindos da **API NestJS**; ranking calculado preferencialmente no servidor. |
| Login | Fluxo OAuth Google concluído no backend; sessão do cliente via **JWT** (ou equivalente). |
| Papel do usuário | Definido **somente no servidor** (`role` em token ou `GET /users/me`); sem seleção manual de perfil no cliente. |
| Administração | Gestão de candidatos, usuários e abertura/fechamento de votação no **painel desktop**, não no fluxo principal do mobile para `PUBLIC` / `JUDGE`. |
| Critérios | Labels dos critérios podem permanecer no app (como em `JUDGE_CRITERIA` / `PUBLIC_CRITERIA` em `App.tsx`) ou serem fornecidos pela API, conforme decisão de produto. |

### 0.3 Diretrizes de implementação

1. **Cliente HTTP** (fetch/axios), armazenamento seguro de token e contexto de autenticação.
2. Consumir **API NestJS** para candidatos, votos e ranking.
3. Após login, usar **`GET /users/me`** (ou equivalente) para `role`, critérios aplicáveis e navegação.
4. Usuários **`ADMIN`**: redirecionar ou orientar ao painel web (ou restringir login no mobile, conforme produto).
5. Opcional: **PWA** (manifest + service worker) sobre o mesmo Vite para experiência instalável.

---

## 1. Objetivos e escopo

| Meta | Descrição |
|------|-----------|
| Votação mobile | App em [`mobile/`](./mobile/) (Vite/React): login, candidatos, votação por critérios (conforme perfil), ranking. |
| Gestão desktop | Interface web otimizada para telas grandes: CRUD de candidatos e gestão de usuários (incluindo alteração de papel). |
| Regras de negócio | Manter critérios, ponderação **60% jurados / 40% público**, controle de abertura de votação por candidato e uma avaliação por usuário/candidato onde aplicável. |

Fora do escopo inicial (pode entrar em fases posteriores): apps **nativas** store-ready quando o foco for primeiro o cliente web mobile; pagamentos; multi-evento com tenants isolados; auditoria formal para disputas judiciais.

---

## 2. Perfis de usuário e política de cadastro

### 2.1 Papéis (`role`)

| Papel | Código sugerido | Uso principal |
|-------|-----------------|---------------|
| Público | `PUBLIC` | Auto cadastro no mobile; critérios de preferência (4). |
| Jurado | `JUDGE` | Critérios técnicos (5); atribuído pelo administrador. |
| Administrador | `ADMIN` | Abrir/fechar votação por candidato; gestão de candidatos e usuários; ranking operacional. |

### 2.2 Cadastro e promoção de papel

- **Mobile**: fluxo de auto cadastro (e login). Todo usuário criado por esse fluxo recebe **`PUBLIC`** por padrão.
- **Alteração de papel**: apenas **`ADMIN`** (via painel desktop) pode alterar `PUBLIC` ↔ `JUDGE` ou conceder `ADMIN`. Recomenda-se exigir pelo menos um `ADMIN` inicial via seed/migração ou variável de ambiente na primeira instalação, para não haver “painel sem admin”.
- **Autenticação**: README prevê login com Google (simulado ou real). A API deve aceitar OAuth Google no backend e emitir sessão própria (JWT ou similar) para mobile e admin.

### 2.3 Matriz de permissões (resumo)

| Ação | PUBLIC | JUDGE | ADMIN |
|------|--------|-------|-------|
| Ver candidatos / ranking | ✓ | ✓ | ✓ |
| Votar (critérios do papel) | ✓ se votação aberta | ✓ se aberta | — |
| CRUD candidatos | — | — | ✓ |
| Abrir/fechar votação por candidato | — | — | ✓ |
| Listar/editar usuários e `role` | — | — | ✓ |

---

## 3. Cliente mobile (votação)

### 3.1 Responsabilidades

- Onboarding, login (Google), logout, exibição do perfil (foto/nome conforme provedor).
- Listagem e detalhe do candidato (nome, música, gênero, foto, bio, redes).
- Fluxo de votação: critérios conforme `role` (4 para público, 5 para jurado), notas 1–10, confirmação; bloqueio se candidato fechado ou já votou (regra de unicidade definida no backend).
- Ranking em tempo quase real (polling ou WebSocket/SSE — ver backend).
- **Não** expor telas de gestão de outros usuários nem CRUD de candidatos no mobile (apenas consumo).

### 3.2 Estrutura de UI em `mobile/`

Organizar telas em `mobile/src/app/components/` — por exemplo `VotingHeader`, `ArtistCard`, `ArtistDetails`, `CriteriaVoting`, `VoteConfirmation`, `Ranking`, `UserMenu` — com dados vindos da **API** e **guardas de rota** por `role`. Telas de administração no mesmo pacote (ex.: `AdminPanel`) não compõem o fluxo principal de produção para eleitores; concentram-se no desktop ou ficam restritas a desenvolvimento, conforme política do time.

### 3.3 UX notas

- Alinhado ao README: gradientes roxo/rosa, animações leves, navegação simples.
- Fluxo lógico: Login → (papel definido no servidor) → Votação / Ranking — **sem** “escolher perfil” manual no cliente; roteamento condicional com base em `role` retornado pela API.

---

## 4. Cliente web desktop (administração)

Painel em repositório ou pasta dedicada (ex. `admin/` ou `web/`). Fluxos de **abrir/fechar votação** e visão operacional devem consumir a **API NestJS** com layouts para desktop. Referência de UX opcional: componente [`AdminPanel`](./mobile/src/app/components/AdminPanel.tsx) no pacote `mobile/` (mesmo comportamento funcional, não obrigatório compartilhar código).

### 4.1 Responsabilidades

- **Autenticação**: mesmo provedor Google + sessão API; restrição de rota a `ADMIN`.
- **Candidatos**: criar, editar, listar, (opcional) desativar; campos alinhados ao README + URLs de mídia (foto) e redes.
- **Usuários**: listar usuários, alterar `role` (`PUBLIC` | `JUDGE` | `ADMIN`), opcionalmente bloquear conta.
- **Operação do evento**: por candidato, alternar **votação aberta/fechada**; indicadores visuais espelham estado retornado pela API.
- **Ranking**: visualização para operação (consistente com mobile).

### 4.2 UX notas

- Layout para teclado e telas largas: tabelas, formulários, filtros.
- Confirmações para ações críticas (promover a `ADMIN`, fechar votação).

---

## 5. Backend NestJS

### 5.1 Stack sugerida

- **NestJS** (HTTP), **TypeORM** ou **Prisma** com PostgreSQL (recomendado para consistência e relatórios).
- **Passport**: estratégia Google OAuth2 + estratégia JWT para rotas internas.
- **Validação**: `class-validator` / `class-transformer` nos DTOs.
- **Tempo real (opcional fase 1)**: `@nestjs/websockets` + adapter Redis para ranking; alternativa mínima — polling no cliente sobre endpoints de ranking.

### 5.2 Módulos sugeridos

| Módulo | Função |
|--------|--------|
| `AuthModule` | OAuth Google, callback, emissão de JWT (access + refresh opcional), guards. |
| `UsersModule` | CRUD limitado; listagem e patch de `role` só `ADMIN`; perfil do usuário logado. |
| `CandidatesModule` | CRUD admin; leitura autenticada para mobile. |
| `VotingModule` | Estado aberto/fechado por candidato; submissão de votos; validação de critérios por `role`; impedir duplicidade. |
| `RankingModule` | Agregações: médias por critério, score ponderado 60/40, leaderboard. |

### 5.3 Modelo de dados (conceitual)

- **User**: id, email único, nome, foto URL, `role`, timestamps, opcional `disabled`.
- **Candidate**: id, nome, música, gênero, bio, foto URL, links (Instagram, YouTube), `votingOpen` boolean, ordem de exibição, `active`.
- **Vote**: id, `userId`, `candidateId`, critérios com notas 1–10 (JSON normalizado ou colunas por critério), `createdAt`; **constraint** única `(userId, candidateId)` para um voto por par.
- **Critérios**: podem ser enums no código + validação no serviço, ou tabelas de configuração se precisar mudar sem deploy.

### 5.4 Regras de votação (servidor)

- Só aceitar votos se `candidate.votingOpen === true` e usuário autenticado.
- Validar conjunto de critérios conforme `user.role` (4 vs 5 campos).
- Recalcular ranking de forma determinística (mesma fórmula que o README).

### 5.5 API (REST) — esboço

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

### 5.6 Segurança

- JWT em header `Authorization: Bearer`, tempo de vida curto no access token.
- HTTPS em produção; CORS restrito aos origins do mobile web/admin.
- Rate limit em `POST .../votes` e em login.
- Admin não pode remover o último `ADMIN` sem substituto (regra de negócio).

### 5.7 Observabilidade

- Logs estruturados; métricas básicas (latência, 4xx/5xx); health check para orquestração.

---

## 6. Integração entre camadas

```
mobile/ (Vite + React)  ──HTTPS──►  NestJS API  ◄──HTTPS──  Admin web (desktop)
                                  │
                             PostgreSQL
```

- O cliente em **`mobile/`** é o front de votação para navegadores em dispositivos móveis; a stack acima é a referência; alternativas devem manter contratos com a mesma API.
- Contratos: OpenAPI/Swagger gerado pelo Nest (`@nestjs/swagger`) recomendado para evitar divergência mobile/admin.

---

## 7. Critérios de aceite (MVP)

1. Usuário se cadastra/loga no mobile via Google e permanece `PUBLIC` até um admin alterar.
2. Admin gerencia candidatos no desktop e abre/fecha votação por candidato.
3. Público e jurado votam apenas com seus critérios; servidor rejeita combinações inválidas e candidatos fechados.
4. Ranking reflete a ponderação 60/40 e está disponível para todos os perfis autenticados.
5. Admin altera `role` entre público, jurado e administrador pelo painel.

---

## 8. Próximos passos de implementação sugeridos

1. Repositório Nest + PostgreSQL + schema inicial + seed de admin.
2. Auth Google + JWT + guards por `role`.
3. CRUD candidatos + flag `votingOpen`.
4. Endpoint de votos + índices únicos + ranking.
5. Cliente **`mobile/`**: camada HTTP, auth e tipos alinhados ao OpenAPI; integração com candidatos, votos e ranking; navegação baseada em `users/me` e `role`.
6. Admin web desktop (rotas protegidas); alinhar UX de operação ao escopo da API.
7. Ajustar pacote **`mobile/`**: garantir que fluxos de eleitor não dependam de telas administrativas em produção; compartilhar código com o admin apenas onde fizer sentido.

O pacote **`mobile/`** é adequado como base **web mobile-first** (Vite). Evoluir para **PWA** ou app **nativo** (React Native/Flutter) é decisão de produto independente da API. Tempo real no ranking: WebSocket/SSE vs polling — definir após carga e orçamento.
