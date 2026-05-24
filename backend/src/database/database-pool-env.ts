/** Tamanho máximo do pool `pg` por processo da API (TypeORM `extra.max`). */
export function databasePoolMax(): number {
  const raw = process.env.DATABASE_POOL_MAX;
  const n = parseInt(raw ?? '20', 10);
  if (!Number.isFinite(n) || n < 1) {
    return 20;
  }
  return Math.min(n, 100);
}

export function databasePoolMin(): number {
  const raw = process.env.DATABASE_POOL_MIN;
  const n = parseInt(raw ?? '2', 10);
  if (!Number.isFinite(n) || n < 0) {
    return 2;
  }
  const max = databasePoolMax();
  return Math.min(n, max);
}
