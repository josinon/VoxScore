/** Nota mínima/máxima por critério e passo de 0,5 (1, 1.5, …, 10). */
export const VOTE_SCORE_MIN = 1;
export const VOTE_SCORE_MAX = 10;
export const VOTE_SCORE_STEP = 0.5;

export function isValidVoteScore(value: number): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return false;
  }
  if (value < VOTE_SCORE_MIN || value > VOTE_SCORE_MAX) {
    return false;
  }
  const steps = Math.round(value / VOTE_SCORE_STEP);
  const reconstructed = steps * VOTE_SCORE_STEP;
  return Math.abs(reconstructed - value) < 1e-9;
}

/** Penalidade aplicada à nota final: 0 a 10, passos de 0,5. */
export const SCORE_PENALTY_MIN = 0;
export const SCORE_PENALTY_MAX = VOTE_SCORE_MAX;

export function isValidScorePenalty(value: number): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return false;
  }
  if (value < SCORE_PENALTY_MIN || value > SCORE_PENALTY_MAX) {
    return false;
  }
  const steps = Math.round(value / VOTE_SCORE_STEP);
  const reconstructed = steps * VOTE_SCORE_STEP;
  return Math.abs(reconstructed - value) < 1e-9;
}
