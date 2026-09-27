#!/usr/bin/env bash
# Semear 6 candidatos demo + votos (jurado/público) + ranking publicado.
# Uso:
#   API=http://localhost:3000/api/v1 ./scripts/seed-demo-ranking.sh
#   API=http://voxscore-api:3000/api/v1 DATABASE_URL=postgresql://... ./scripts/seed-demo-ranking.sh
#   SKIP_DB_RESET=1 API=... ./scripts/seed-demo-ranking.sh
set -euo pipefail

API="${API:-http://localhost:3000/api/v1}"
PHOTO='https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop'
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@voxscore.test}"
JUDGE_EMAIL="${JUDGE_EMAIL:-judge@voxscore.test}"
PUBLIC_EMAIL="${PUBLIC_EMAIL:-voter@voxscore.test}"

auth() {
  local email="$1"
  local name="${2:-$1}"
  curl -sS -X POST "$API/auth/oauth/mock" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"displayName\":\"$name\"}" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])'
}

reset_db() {
  if [[ "${SKIP_DB_RESET:-}" == "1" ]]; then
    echo "==> SKIP_DB_RESET=1 — a saltar truncate"
    return 0
  fi
  if [[ -z "${DATABASE_URL:-}" && -z "${PGHOST:-}" ]]; then
    echo "ERRO: defina DATABASE_URL ou PGHOST (ou SKIP_DB_RESET=1)." >&2
    exit 1
  fi
  echo "==> Limpando candidatos e votos (Postgres)…"
  if [[ -n "${DATABASE_URL:-}" ]]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE TABLE votes RESTART IDENTITY CASCADE;
TRUNCATE TABLE candidate_penalties RESTART IDENTITY CASCADE;
TRUNCATE TABLE candidates RESTART IDENTITY CASCADE;
UPDATE event_settings
  SET "rankingPublished" = false,
      "votingMode" = 'JUDGES_AND_PUBLIC',
      "judgeWeightPercent" = 80
  WHERE id = 'default';
-- Alinha o admin existente ao email de teste (staging/local).
DELETE FROM users WHERE email = 'admin@voxscore.test' AND role <> 'ADMIN';
UPDATE users
  SET email = 'admin@voxscore.test', "displayName" = 'Administrator'
  WHERE role = 'ADMIN';
SQL
  else
    export PGUSER="${PGUSER:-voxscore}"
    export PGPASSWORD="${PGPASSWORD:-voxscore}"
    export PGDATABASE="${PGDATABASE:-voxscore}"
    export PGPORT="${PGPORT:-5432}"
    psql -h "$PGHOST" -v ON_ERROR_STOP=1 <<'SQL'
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
  fi
}

reset_db

ADMIN_TOKEN=$(auth "$ADMIN_EMAIL" 'Administrator')
echo "==> Admin OK ($ADMIN_EMAIL)"

auth "$JUDGE_EMAIL" 'Jurado Demo' >/dev/null
auth "$PUBLIC_EMAIL" 'Público Demo' >/dev/null

JUDGE_ID=$(curl -sS "$API/users?q=judge&limit=10" -H "Authorization: Bearer $ADMIN_TOKEN" \
  | python3 -c 'import sys,json; items=json.load(sys.stdin)["items"]; print(next(u["id"] for u in items if u["email"]=="'"$JUDGE_EMAIL"'"))')
curl -sS -X PATCH "$API/users/$JUDGE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"role":"JUDGE"}' >/dev/null
echo "==> Jurado pronto"

NAMES=(
  'Luna Santos|Caminhos do Céu|Pop'
  'Rafael Costa|Batida Urbana|Hip Hop'
  'Marina Alves|Voz do Atlântico|MPB'
  'Diego Nunes|Fogo no Palco|Rock'
  'Sofia Ribeiro|Luz de Neon|Eletrônico'
  'Pedro Lima|Sertão em Flor|Sertanejo'
)

JUDGE_SCORES=(9.5 8.5 7.5 6.5 5.5 4.5)
PUBLIC_SCORES=(9.0 8.0 7.0 6.0 5.0 4.0)

CAND_IDS=()
i=0
for entry in "${NAMES[@]}"; do
  IFS='|' read -r name song genre <<<"$entry"
  body=$(python3 - <<PY
import json
print(json.dumps({
  "name": "$name",
  "musicTitle": "$song",
  "genre": "$genre",
  "bio": "Candidato demo — $name",
  "photoUrl": "$PHOTO",
  "votingOpen": True,
  "active": True,
  "displayOrder": $i,
}))
PY
)
  id=$(curl -sS -X POST "$API/candidates" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "$body" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
  CAND_IDS+=("$id")
  echo "  + $name ($id)"
  i=$((i + 1))
done

# Duas penalidades em Luna (1º) para demonstrar o ranking
LUNA_ID="${CAND_IDS[0]}"
curl -sS -X POST "$API/candidates/$LUNA_ID/penalties" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":0.5,"reason":"Atraso na passagem de som"}' >/dev/null
curl -sS -X POST "$API/candidates/$LUNA_ID/penalties" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":1.0,"reason":"Uso de material não autorizado"}' >/dev/null
echo "==> Penalidades Luna: −0.5 e −1.0"

JUDGE_TOKEN=$(auth "$JUDGE_EMAIL" 'Jurado Demo')
PUBLIC_TOKEN=$(auth "$PUBLIC_EMAIL" 'Público Demo')

criteria_json() {
  local n="$1"
  python3 - <<PY
import json
n = float("$n")
print(json.dumps({
  "scriptDevelopment": n,
  "creativity": n,
  "synchronism": n,
  "originalityAndMusicality": n,
}))
PY
}

echo "==> Registando votos…"
for idx in "${!CAND_IDS[@]}"; do
  cid="${CAND_IDS[$idx]}"
  j="${JUDGE_SCORES[$idx]}"
  p="${PUBLIC_SCORES[$idx]}"
  curl -sS -X POST "$API/candidates/$cid/votes" \
    -H "Authorization: Bearer $JUDGE_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"criteriaScores\": $(criteria_json "$j")}" >/dev/null
  curl -sS -X POST "$API/candidates/$cid/votes" \
    -H "Authorization: Bearer $PUBLIC_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"criteriaScores\": $(criteria_json "$p")}" >/dev/null
  curl -sS -X PATCH "$API/candidates/$cid/voting" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"open":false}' >/dev/null
done

curl -sS -X PATCH "$API/ranking/voting-mode" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"votingMode":"JUDGES_AND_PUBLIC"}' >/dev/null
curl -sS -X PATCH "$API/ranking/score-weights" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"judgeWeightPercent":80}' >/dev/null
curl -sS -X PATCH "$API/ranking/publish" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"published":true}' >/dev/null

echo "==> Ranking publicado:"
curl -sS "$API/ranking" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c '
import sys, json
d = json.load(sys.stdin)
print("mode=%s weights=%s/%s published=%s" % (d["votingMode"], d["judgeWeightPercent"], d["publicWeightPercent"], d["resultsPublished"]))
for e in d["entries"]:
    print("  #%s %s: final=%s judge=%s public=%s penalty=%s votes=%s" % (
      e["rank"], e["candidateName"], e["finalScore"],
      e.get("judgeCompositeAverage"), e.get("publicCompositeAverage"),
      e.get("scorePenalty"), e["voteCount"]))
'

echo
echo "Pronto."
echo "  Admin:  $ADMIN_EMAIL"
echo "  Jurado: $JUDGE_EMAIL"
echo "  Público: $PUBLIC_EMAIL"
