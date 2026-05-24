/** Lido em cada chamada (permite testes ajustarem `process.env`). `0` = sem debounce. */
export function rankingBroadcastDebounceMs(): number {
  const raw = process.env.REALTIME_RANKING_DEBOUNCE_MS;
  const n = parseInt(raw ?? '1500', 10);
  if (!Number.isFinite(n) || n < 0) {
    return 1500;
  }
  return n;
}
