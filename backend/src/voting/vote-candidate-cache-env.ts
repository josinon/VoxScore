/** Lido em cada operação (permite testes ajustarem `process.env`). */
export function voteCandidateCacheEnabled(): boolean {
  const raw = process.env.VOTE_CANDIDATE_CACHE_ENABLED;
  if (raw === undefined || raw === '') {
    return true;
  }
  return raw !== 'false' && raw !== '0';
}

export function voteCandidateCacheTtlMs(): number {
  const raw = process.env.VOTE_CANDIDATE_CACHE_TTL_MS;
  const n = parseInt(raw ?? '8000', 10);
  if (!Number.isFinite(n) || n < 0) {
    return 8000;
  }
  return n;
}
