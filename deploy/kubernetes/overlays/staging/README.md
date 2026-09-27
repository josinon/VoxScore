# Staging / homologação (Mega Voz)

Ambiente **isolado** de produção para testes e validação, com recursos reduzidos e dados demo (6 candidatos + votos).

| | Produção | Staging |
|---|----------|---------|
| Namespace | `voxscore` | `voxscore-staging` |
| URL | https://megavoz.lab6.cloud | https://staging-megavoz.lab6.cloud |
| API / FE réplicas | 4 / 2 | 1 / 1 |
| Postgres PVC | 10 Gi | 2 Gi |
| Login | Google OAuth | **Mock OAuth** (formulário no login) |
| Dados | reais | seed demo |

## O que precisa configurar (DNS + acesso público)

O cluster já expõe HTTP/HTTPS no IP do Traefik (mesmo de produção):

**`148.230.73.227`**

### 1. DNS

No painel DNS de `lab6.cloud`, crie um registo:

| Tipo | Nome / host | Valor |
|------|-------------|--------|
| **A** | `staging-megavoz` | `148.230.73.227` |

Resultado esperado: `staging-megavoz.lab6.cloud` resolve para esse IP.

Verificação:

```bash
dig +short staging-megavoz.lab6.cloud
# deve responder: 148.230.73.227
```

### 2. TLS (automático após DNS)

O Ingress do staging usa cert-manager + Let’s Encrypt (`letsencrypt-prod`). Depois do DNS apontar corretamente:

```bash
kubectl -n voxscore-staging get certificate
# Ready=True → Secret voxscore-staging-tls
```

Sem DNS (ou com DNS errado), o desafio HTTP-01 falha e o HTTPS não fica válido.

### 3. Firewall / rede

Garanta que as portas **80** e **443** no IP `148.230.73.227` estão abertas à Internet (já usadas por produção). Não é necessário LoadBalancer extra.

### 4. OAuth Google (opcional)

Staging usa **mock login** por defeito — não precisa de Google. Se quiser Google real neste host, acrescente na consola Google:

- `https://staging-megavoz.lab6.cloud/api/v1/auth/google/callback`

e atualize o Secret `voxscore-api` no namespace `voxscore-staging` (sem `kubectl apply -k` se isso sobrescrever secrets em produção — aqui o overlay é só staging).

## Deploy

Na raiz do repositório (requer Docker Desktop + `kubectl` apontando ao cluster):

```bash
chmod +x deploy/kubernetes/overlays/staging/deploy.sh
./deploy/kubernetes/overlays/staging/deploy.sh
```

Ou manualmente:

```bash
# Frontend com VITE_SHOW_DEV_LOGIN=true
docker build \
  --build-arg VITE_OAUTH_REDIRECT_ORIGIN=https://staging-megavoz.lab6.cloud \
  --build-arg VITE_SHOW_DEV_LOGIN=true \
  -t josinon/voxscore-frontend:0.0.21-staging ./frontend
docker push josinon/voxscore-frontend:0.0.21-staging

kubectl apply -k deploy/kubernetes/overlays/staging

kubectl -n voxscore-staging delete job voxscore-migrate --ignore-not-found
kubectl -n voxscore-staging apply -f deploy/kubernetes/overlays/staging/job-migrate.yaml
kubectl -n voxscore-staging wait --for=condition=complete job/voxscore-migrate --timeout=180s

kubectl -n voxscore-staging delete job voxscore-seed-demo --ignore-not-found
kubectl -n voxscore-staging apply -f deploy/kubernetes/overlays/staging/job-seed.yaml
kubectl -n voxscore-staging wait --for=condition=complete job/voxscore-seed-demo --timeout=180s
```

## Login de teste

Abra https://staging-megavoz.lab6.cloud → secção **Desenvolvimento — login via mock OAuth**:

| Perfil | Email |
|--------|--------|
| Admin | `admin@voxscore.test` |
| Público / votante | `voter@voxscore.test` |
| Jurado (seed) | `judge@voxscore.test` |

O seed cria 6 candidatos, votos de jurado/público, ranking publicado e 2 penalidades em Luna Santos.

## Re-semear dados

```bash
kubectl -n voxscore-staging delete job voxscore-seed-demo --ignore-not-found
kubectl -n voxscore-staging apply -f deploy/kubernetes/overlays/staging/job-seed.yaml
```

## Atualizar versão

Alinhe `images.newTag` em [`kustomization.yaml`](./kustomization.yaml) e a tag no [`job-migrate.yaml`](./job-migrate.yaml); faça build/push da API e do frontend `-staging` (com `VITE_SHOW_DEV_LOGIN=true`).
