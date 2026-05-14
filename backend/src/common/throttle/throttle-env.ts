function readPositiveInt(name: string, fallback: string): number {
  const raw = process.env[name];
  const n = parseInt(raw ?? fallback, 10);
  const fb = parseInt(fallback, 10);
  return Number.isFinite(n) && n > 0 ? n : fb;
}

/** Lido em cada pedido (permite testes e2e ajustarem `process.env` no `beforeAll`). */
export const votesThrottle = {
  default: {
    limit: () => readPositiveInt('THROTTLE_VOTES_LIMIT', '30'),
    ttl: () => readPositiveInt('THROTTLE_VOTES_TTL_MS', '60000'),
  },
};

export const authThrottle = {
  default: {
    limit: () => readPositiveInt('THROTTLE_AUTH_LIMIT', '40'),
    ttl: () => readPositiveInt('THROTTLE_AUTH_TTL_MS', '60000'),
  },
};
