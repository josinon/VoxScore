import { getAccessToken } from './auth-storage';
import { debounce } from './debounce';
import {
  getApiBaseUrl,
  isAdminRealtimeEnabled,
  realtimeRankingDebounceMs,
} from './env';

export type VoterRealtimeMessage =
  | { type: 'candidates_changed' }
  | { type: 'ranking_changed' };

/** URL `ws:` / `wss:` do feed em tempo real; token na query (limitação do WebSocket no browser). */
export function getRealtimeWsUrlForToken(accessToken: string): string {
  const query = `token=${encodeURIComponent(accessToken)}`;
  const path = `/api/v1/ws?${query}`;
  const apiBase = getApiBaseUrl();
  if (apiBase) {
    const httpUrl = new URL(
      apiBase.startsWith('http') ? apiBase : `https://${apiBase}`,
    );
    const wsProto = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${httpUrl.host}${path}`;
  }
  if (typeof window === 'undefined') {
    return `ws://127.0.0.1${path}`;
  }
  const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProto}//${window.location.host}${path}`;
}

const RECONNECT_MS = 3000;

/**
 * WebSocket em tempo real — **apenas painel ADMIN**.
 * Público e jurado não devem chamar (usam polling em `MegadanceVoterApp`).
 */
export function connectAdminRealtime(handlers: {
  onCandidatesChanged: () => void;
  onRankingChanged: () => void;
}): () => void {
  if (!isAdminRealtimeEnabled()) {
    return () => {};
  }

  const rankingDebounceMs = realtimeRankingDebounceMs();
  const onRankingChanged =
    rankingDebounceMs === 0
      ? handlers.onRankingChanged
      : debounce(handlers.onRankingChanged, rankingDebounceMs);

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;

  const clearReconnect = () => {
    if (reconnectTimer !== undefined) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
  };

  const scheduleReconnect = () => {
    clearReconnect();
    if (cancelled) {
      return;
    }
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = undefined;
      connect();
    }, RECONNECT_MS);
  };

  function connect() {
    if (cancelled) {
      return;
    }
    const token = getAccessToken();
    if (!token) {
      scheduleReconnect();
      return;
    }
    ws = new WebSocket(getRealtimeWsUrlForToken(token));
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as VoterRealtimeMessage;
        if (msg.type === 'candidates_changed') {
          handlers.onCandidatesChanged();
        }
        if (msg.type === 'ranking_changed') {
          onRankingChanged();
        }
      } catch {
        /* ignore malformed */
      }
    };
    ws.onclose = () => {
      ws = null;
      scheduleReconnect();
    };
    ws.onerror = () => {
      ws?.close();
    };
  }

  connect();

  return () => {
    cancelled = true;
    clearReconnect();
    if ('cancel' in onRankingChanged) {
      onRankingChanged.cancel();
    }
    ws?.close();
    ws = null;
  };
}

/** @deprecated Use `connectAdminRealtime` — mantido para imports antigos. */
export const connectVoterRealtime = connectAdminRealtime;
