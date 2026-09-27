#!/usr/bin/env bash
# Wrapper local: limpa Postgres via docker compose e chama seed-demo-ranking.sh.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="${API:-http://localhost:3000/api/v1}"

echo "==> Limpando candidatos e votos (Postgres local)…"
docker --context desktop-linux compose -f "$ROOT/docker-compose.yml" exec -T postgres \
  psql -U voxscore -d voxscore -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE TABLE votes RESTART IDENTITY CASCADE;
TRUNCATE TABLE candidate_penalties RESTART IDENTITY CASCADE;
TRUNCATE TABLE candidates RESTART IDENTITY CASCADE;
UPDATE event_settings
  SET "rankingPublished" = false,
      "votingMode" = 'JUDGES_AND_PUBLIC',
      "judgeWeightPercent" = 80
  WHERE id = 'default';
DELETE FROM users WHERE email = 'admin@voxscore.test' AND role <> 'ADMIN';
UPDATE users
  SET email = 'admin@voxscore.test', "displayName" = 'Administrator'
  WHERE role = 'ADMIN';
SQL

SKIP_DB_RESET=1 API="$API" "$ROOT/deploy/kubernetes/overlays/staging/seed-demo-ranking.sh"
