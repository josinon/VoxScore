/** Base da API sem barra final; vazio = usar URLs relativas `/api/v1` (proxy Vite em dev). */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return raw?.replace(/\/$/, '') ?? '';
}

/** Kill switch global (ex.: e2e). Quando `false`, o admin também deixa de usar WebSocket. */
export function isRealtimeEnabled(): boolean {
  return import.meta.env.VITE_REALTIME_ENABLED !== 'false';
}

/** WebSocket só no painel admin; público e jurado usam polling HTTP. */
export function isAdminRealtimeEnabled(): boolean {
  return isRealtimeEnabled();
}

/** Intervalo de polling da lista de candidatos (público/jurado). `0` = desligado. */
export function voterCandidatesPollingMs(): number {
  const raw = import.meta.env.VITE_VOTER_CANDIDATES_POLL_MS as
    | string
    | undefined;
  const n = parseInt(raw ?? '10000', 10);
  if (!Number.isFinite(n) || n < 0) {
    return 10000;
  }
  return n;
}

/** Intervalo de polling do ranking quando aberto (público/jurado). `0` = desligado. */
export function voterRankingPollingMs(): number {
  const raw = import.meta.env.VITE_VOTER_RANKING_POLL_MS as string | undefined;
  const n = parseInt(raw ?? '8000', 10);
  if (!Number.isFinite(n) || n < 0) {
    return 8000;
  }
  return n;
}

/** Debounce de `loadRanking` após `ranking_changed` (ms). `0` = sem debounce no cliente. */
export function realtimeRankingDebounceMs(): number {
  const raw = import.meta.env.VITE_REALTIME_RANKING_DEBOUNCE_MS as
    | string
    | undefined;
  const n = parseInt(raw ?? '750', 10);
  if (!Number.isFinite(n) || n < 0) {
    return 750;
  }
  return n;
}

export function getOAuthRedirectOrigin(): string {
  const raw = import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN as string | undefined;
  if (raw?.trim()) {
    return raw.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export function showDevLogin(): boolean {
  return (
    Boolean(import.meta.env.DEV) ||
    import.meta.env.VITE_SHOW_DEV_LOGIN === 'true'
  );
}
