/** Lido em cada operação (permite testes ajustarem `process.env`). */
export function rankingCacheEnabled(): boolean {
  const raw = process.env.RANKING_CACHE_ENABLED;
  if (raw === undefined || raw === '') {
    return true;
  }
  return raw !== 'false' && raw !== '0';
}

export function rankingCacheTtlMs(): number {
  const raw = process.env.RANKING_CACHE_TTL_MS;
  const n = parseInt(raw ?? '3000', 10);
  if (!Number.isFinite(n) || n < 0) {
    return 3000;
  }
  return n;
}
