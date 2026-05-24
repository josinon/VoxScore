export function redisUrl(): string | undefined {
  const raw = process.env.REDIS_URL?.trim();
  return raw || undefined;
}

/** Quando `true`, falha o arranque se `REDIS_URL` estiver definido mas a ligação falhar. */
export function redisRequired(): boolean {
  const raw = process.env.REDIS_REQUIRED;
  if (raw === undefined || raw === '') {
    return Boolean(redisUrl());
  }
  return raw !== 'false' && raw !== '0';
}
