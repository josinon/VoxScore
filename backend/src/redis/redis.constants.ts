export const REDIS_REALTIME_CHANNEL = 'voxscore:realtime';

/** TTL renovado a cada voto; expiração dispara `ranking_changed` em todos os pods. */
export const REDIS_KEY_RANKING_DEBOUNCE = 'voxscore:realtime:ranking:debounce';

export const REDIS_KEY_RANKING_CACHE_SCORES = 'voxscore:ranking:scores';
export const REDIS_KEY_RANKING_CACHE_COUNTS = 'voxscore:ranking:counts';

export type RealtimeChannelMessage =
  | { type: 'candidates_changed' }
  | { type: 'ranking_changed' };
