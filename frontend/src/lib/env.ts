/** Base da API sem barra final; vazio = usar URLs relativas `/api/v1` (proxy Vite em dev). */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return raw?.replace(/\/$/, '') ?? '';
}

/** Quando `false`, a SPA não abre WebSocket (útil em e2e sem servidor WS). */
export function isRealtimeEnabled(): boolean {
  return import.meta.env.VITE_REALTIME_ENABLED !== 'false';
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
