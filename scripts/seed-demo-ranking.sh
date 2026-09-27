#!/usr/bin/env bash
# Wrapper: script canónico vive no overlay staging (restricao kustomize).
exec "$(cd "$(dirname "$0")/.." && pwd)/deploy/kubernetes/overlays/staging/seed-demo-ranking.sh" "$@"
