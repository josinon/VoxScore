#!/usr/bin/env bash
# Reseta candidatos/votos locais e cria 6 candidatos com notas distintas.
set -euo pipefail

API="${API:-http://localhost:3000/api/v1}"
PHOTO='https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop'

auth() {
  local email="$1"
  local name="${2:-$1}"
  curl -sS -X POST "$API/auth/oauth/mock" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"displayName\":\"$name\"}" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])'
}

echo "==> Limpando candidatos e votos (Postgres)…"
docker --context desktop-linux compose -f "$(dirname "$0")/../docker-compose.yml" exec -T postgres \
  psql -U voxscore -d voxscore -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE TABLE votes RESTART IDENTITY CASCADE;
TRUNCATE TABLE candidates RESTART IDENTITY CASCADE;
UPDATE event_settings
  SET "rankingPublished" = false,
      "votingMode" = 'JUDGES_AND_PUBLIC',
      "judgeWeightPercent" = 80
  WHERE id = 'default';
SQL

ADMIN_TOKEN=$(auth 'admin@voxscore.local' 'Administrator')
echo "==> Admin OK"

# Promote judge user
JUDGE_EMAIL='judge-demo@voxscore.local'
PUBLIC_EMAIL='public-demo@voxscore.local'
auth "$JUDGE_EMAIL" 'Jurado Demo' >/dev/null
auth "$PUBLIC_EMAIL" 'Público Demo' >/dev/null

JUDGE_ID=$(curl -sS "$API/users?q=judge-demo&limit=5" -H "Authorization: Bearer $ADMIN_TOKEN" \
  | python3 -c 'import sys,json; items=json.load(sys.stdin)["items"]; print(next(u["id"] for u in items if u["email"]=="judge-demo@voxscore.local"))')
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

# Notas base distintas (média aproximada): 9.5, 8.5, 7.5, 6.5, 5.5, 4.5
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
  "bio": "Candidato demo local — $name",
  "photoUrl": "$PHOTO",
  "votingOpen": True,
  "active": True,
  "displayOrder": $i,
  "scorePenalty": 0,
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
  # Fechar votação
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
    print("  #%s %s: final=%s judge=%s public=%s votes=%s" % (e["rank"], e["candidateName"], e["finalScore"], e["judgeCompositeAverage"], e["publicCompositeAverage"], e["voteCount"]))
'

echo
echo "Pronto. Login admin: admin@voxscore.local"
echo "Login jurado: $JUDGE_EMAIL | Login público: $PUBLIC_EMAIL"
