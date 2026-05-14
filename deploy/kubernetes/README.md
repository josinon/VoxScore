# VoxScore — Implantação em Kubernetes

Este documento alinha **backend** (NestJS) e **frontend** (SPA Vite/React) ao ambiente de referência descrito no [DEVSPEC.md](../DEVSPEC.md) (§5.1). Não substitui um chart Helm ou operador concreto do vosso cluster; define contratos e padrões mínimos.

## Visão geral

| Componente | Papel no cluster |
|------------|------------------|
| **API** | `Deployment` + `Service`; tráfego externo via **Ingress** (ou API Gateway) com TLS. |
| **Frontend** | Ficheiros estáticos do `npm run build` em **nginx** (imagem pequena) ou equivalente; outro `Deployment` + `Service` + **Ingress** (mesmo host com path `/` ou host dedicado, conforme produto). |
| **PostgreSQL** | Recomendado: base **gerida** (RDS, AlloyDB, Azure Database, etc.) referenciada por `DATABASE_URL` num **Secret**. In-cluster só com operador/StatefulSet e operação explícita. |

## Variáveis e segredos

| Chave (exemplo) | Onde | Notas |
|-----------------|------|--------|
| `DATABASE_URL` | **Secret** (API) | URL JDBC/Postgres; rotação fora do Git. |
| `TYPEORM_MIGRATIONS_RUN` | **ConfigMap** / env | Use **`false`** nas réplicas da API e execute migrações num **Job** antes do rollout; evita corridas com vários Pods. |
| Segredo JWT / OAuth | **Secret** (API) | Nunca em ConfigMap nem na imagem. |
| Origens CORS | **ConfigMap** ou env da API | Deve coincidir com a URL **pública** do Ingress do frontend (`https://app.exemplo.com`). |
| `THROTTLE_*` (opcional) | **ConfigMap** | Limites de `POST .../votes` e auth; ver [`backend/.env.example`](../backend/.env.example). |
| URL da API no browser | **Build-time** (`VITE_*` ou similar) | O bundle do React embute a base URL; o pipeline de CI/CD do frontend deve injetar a URL pública da API **por ambiente** (staging/produção). |

## Health checks (API)

O endpoint **`GET /api/v1/health`** valida conectividade ao PostgreSQL (ver [backend/README.md](../backend/README.md)).

- **readinessProbe**: HTTP GET nesse path, `initialDelaySeconds` suficiente para migrações na primeira subida (ou garantir que o Pod só arranca após Job de migrate).
- **livenessProbe**: pode ser o mesmo path **se** o check for rápido e não bloquear sob carga; em alternativa, um endpoint só “vivo” sem DB (a introduzir se necessário).

Fragmento ilustrativo (ajustar `port` e nomes):

```yaml
readinessProbe:
  httpGet:
    path: /api/v1/health
    port: http
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
livenessProbe:
  httpGet:
    path: /api/v1/health
    port: http
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3
```

## Migrações (TypeORM)

- Correr **`npm run migration:run`** (ou binário equivalente na imagem) num **Job** `Kubernetes` com a mesma imagem/tag da API e o mesmo `DATABASE_URL`, **antes** de aumentar réplicas com novo schema, ou usar um único executor com lock (ex. ferramenta de release do chart).
- Evitar vários Pods a executarem migrações em paralelo sem coordenação.

## Ingress, CORS e OAuth Google

- **Ingress**: TLS terminado no controlador ou no gateway; backends em HTTP interno é aceitável desde que a malha interna esteja protegida.
- **CORS**: a API deve listar o origin exato do frontend (URL do Ingress), não `http://localhost` em produção.
- **OAuth Google**: URIs de redirect autorizadas na consola Google devem ser as URLs **públicas** do backend (callback), não URLs internas `*.svc.cluster.local`.

## Frontend (nginx)

Fluxo típico de imagem:

1. `npm ci` + `npm run build` com `VITE_*` apontando para a API pública.
2. `COPY dist /usr/share/nginx/html` (e `nginx.conf` com `try_files $uri /index.html` para SPA).

Recursos: CPU/mem baixos; HPA opcional se servir tráfego muito alto na borda (normalmente CDN + cache estáticos reduz necessidade de réplicas).

## Próximos passos no repositório

- Adicionar `Dockerfile` em `backend/` e `frontend/` e pipeline que publique imagens no registry do cluster.
- Opcional: Helm/Kustomize com `Deployment`, `Service`, `Ingress`, `Secret` e `Job` de migração versionados junto do código.
