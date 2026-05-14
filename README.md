# VoxScore

Resumo das funcionalidades — **Megadance 2026**.

## 1. Autenticação

- Login obrigatório com Google (simulado)
- Controle de sessão com logout
- Menu de usuário com foto e informações

## 2. Três perfis de acesso

### Administrador

- **CRUD de candidatos** e flag **ativo** (candidatos inativos não aparecem na lista pública) via API
- **Abertura/fechamento de votação** por candidato (`PATCH .../voting`), com indicadores verde/cinza na UI
- **Gestão de utilizadores**: listar, alterar papel (`PUBLIC` / `JUDGE` / `ADMIN`) e desativar; o servidor impede remover o último `ADMIN`
- **Ranking** do servidor (`GET /ranking`) no painel

### Jurado

Avaliação por **5 critérios técnicos**:

- Técnica Vocal
- Interpretação
- Presença de Palco
- Originalidade
- Composição

- Notas de 1 a 10 estrelas por critério
- Pode avaliar múltiplos candidatos

### Público

Avaliação por **4 critérios de preferência**:

- Entretenimento
- Emoção
- Gostei da Música
- Ouviria Novamente

- Notas de 1 a 10 estrelas por critério
- Pode avaliar múltiplos candidatos

## 3. Sistema de votação

- Votação só liberada após o admin abrir para cada apresentação
- Interface com estrelas (1–10) para avaliação
- Todos os critérios obrigatórios
- Confirmação visual após o voto
- Bloqueio de candidatos não liberados

## 4. Candidatos

Candidatos geridos pelo **administrador** na API (nome, música, género, foto, biografia, redes). A lista pública mostra apenas candidatos **ativos**; o painel admin lista todos (incl. inativos) para gestão.

## 5. Ranking

- Pontuação ponderada: **60% jurados + 40% público**
- Visualização em tempo real
- Pódio visual (troféus para top 3)
- Detalhamento de votos por categoria
- Acessível para todos os perfis

## 6. Interface mobile first

- Design responsivo otimizado para celular
- Gradientes roxo/rosa
- Animações suaves
- Navegação intuitiva

## 7. Fluxo completo

Login (papel definido pelo servidor) → Votação ou painel admin (conforme `role`) → Ranking quando disponível.

## 8. Demo local (stack mínima)

1. **PostgreSQL** — na raiz do repo: `docker compose up -d postgres` (ou use o seu Postgres). URL típica: `postgresql://voxscore:voxscore@localhost:5432/voxscore`.
2. **API** — em `backend/`: `cp .env.example .env`, defina `JWT_SECRET`, ative `AUTH_DEV_TOKEN_ENABLED=true` e `AUTH_GOOGLE_MOCK_ENABLED=true` para desenvolvimento com login mock; `npm ci`, `npm run migration:run`, `npm run start:dev`. A API fica em **http://localhost:3000** com prefixo **`/api/v1`**. Saúde (readiness com ping à base): **GET http://localhost:3000/api/v1/health**.
3. **Frontend** — em `frontend/`: `npm ci`, opcionalmente `cp .env.example .env` (ver `VITE_*`); `npm run dev` (predefinição **http://127.0.0.1:5173**). O proxy Vite encaminha `/api` para a API; defina `VITE_API_BASE_URL` se o browser não usar o mesmo host.
4. **Login em dev** — com `VITE_SHOW_DEV_LOGIN=true` (predefinição nos e2e), o ecrã de login permite email + OAuth mock; o papel vem do servidor (`GET /users/me`).
5. **Rate limit** — em rajadas, `POST .../candidates/:id/votes` e rotas de auth sensíveis podem responder **429** (ver variáveis `THROTTLE_*` em [`backend/.env.example`](./backend/.env.example)).
6. **Smoke (T10.1)** — com a API a correr **ou** só com mocks de rede: `cd frontend && npm run smoke` (Playwright, ficheiro `e2e/smoke.spec.ts`).

## Desenvolvimento e implantação

- Especificação técnica: [DEVSPEC.md](./DEVSPEC.md) (inclui **Kubernetes** para API e frontend, §5.1).
- Plano por fases: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).
- Guia de cluster: [deploy/kubernetes/README.md](./deploy/kubernetes/README.md).
