#!/usr/bin/env bash
# Deploy / atualiza o ambiente de staging (namespace voxscore-staging).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
TAG_API="${TAG_API:-0.0.21}"
TAG_FE="${TAG_FE:-0.0.21-staging}"
HOST="${STAGING_HOST:-staging-megavoz.lab6.cloud}"
NS=voxscore-staging

cd "$ROOT"

echo "==> Build frontend staging ($TAG_FE) com mock login…"
docker --context desktop-linux build \
  --build-arg VITE_OAUTH_REDIRECT_ORIGIN="https://$HOST" \
  --build-arg VITE_SHOW_DEV_LOGIN=true \
  -t "josinon/voxscore-frontend:$TAG_FE" \
  ./frontend

echo "==> Push imagens…"
docker --context desktop-linux push "josinon/voxscore-frontend:$TAG_FE"
# API reutiliza a mesma tag de produção se já existir no registry
docker --context desktop-linux image inspect "josinon/voxscore-api:$TAG_API" >/dev/null 2>&1 \
  || docker --context desktop-linux build -t "josinon/voxscore-api:$TAG_API" ./backend
docker --context desktop-linux push "josinon/voxscore-api:$TAG_API"

echo "==> Apply kustomize (namespace $NS)…"
kubectl apply -k "$ROOT/deploy/kubernetes/overlays/staging"

echo "==> Migrate…"
kubectl -n "$NS" delete job voxscore-migrate --ignore-not-found
kubectl -n "$NS" apply -f "$ROOT/deploy/kubernetes/overlays/staging/job-migrate.yaml"
kubectl -n "$NS" wait --for=condition=complete job/voxscore-migrate --timeout=180s

echo "==> Rollout…"
kubectl -n "$NS" rollout status deployment/voxscore-api --timeout=180s
kubectl -n "$NS" rollout status deployment/voxscore-frontend --timeout=120s

echo "==> Seed demo (6 candidatos)…"
kubectl -n "$NS" delete job voxscore-seed-demo --ignore-not-found
kubectl -n "$NS" apply -f "$ROOT/deploy/kubernetes/overlays/staging/job-seed.yaml"
kubectl -n "$NS" wait --for=condition=complete job/voxscore-seed-demo --timeout=180s
kubectl -n "$NS" logs job/voxscore-seed-demo --tail=40

echo
echo "Staging: https://$HOST"
echo "Login mock: admin@voxscore.test | voter@voxscore.test (jurado seed: judge@voxscore.test)"
echo
echo "DNS necessário: registo A  $HOST  →  148.230.73.227"
