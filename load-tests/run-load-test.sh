#!/usr/bin/env bash
# Executa o k6 com variáveis definidas (o k6 NÃO lê export do shell sozinho).
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE="${ENV_FILE:-load-test.env}"

if [[ -f "$ENV_FILE" ]]; then
  exec k6 run --env-file="$ENV_FILE" "$@" votes-load.js
fi

if [[ -f load-test.config.json ]]; then
  exec k6 run -e "CONFIG_FILE=load-test.config.json" "$@" votes-load.js
fi

echo "Defina variáveis para o k6 de uma destas formas:"
echo "  1) cp load-test.env.example load-test.env   # editar e: ./run-load-test.sh"
echo "  2) cp load-test.config.json.example load-test.config.json"
echo "  3) k6 run -e BASE_URL=https://... -e CANDIDATE_ID=uuid votes-load.js"
exit 1
