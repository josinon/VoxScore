/** Chaves estáveis do JSON `criteriaScores` para `role === PUBLIC` (README). */
export const PUBLIC_VOTE_CRITERIA = [
  'entertainment',
  'emotion',
  'likedTheMusic',
  'wouldListenAgain',
] as const;

/** Chaves estáveis para `role === JUDGE`. */
export const JUDGE_VOTE_CRITERIA = [
  'vocalTechnique',
  'interpretation',
  'stagePresence',
  'originality',
  'composition',
] as const;

export type PublicCriterionKey = (typeof PUBLIC_VOTE_CRITERIA)[number];
export type JudgeCriterionKey = (typeof JUDGE_VOTE_CRITERIA)[number];
