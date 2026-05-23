/** Chaves estáveis do JSON `criteriaScores` (jurado e público — Megadance 2026). */
export const VOTE_CRITERIA = [
  'scriptDevelopment',
  'creativity',
  'synchronism',
  'originalityAndMusicality',
] as const;

/** @deprecated Use {@link VOTE_CRITERIA}; mantido para imports existentes. */
export const PUBLIC_VOTE_CRITERIA = VOTE_CRITERIA;

/** @deprecated Use {@link VOTE_CRITERIA}; mantido para imports existentes. */
export const JUDGE_VOTE_CRITERIA = VOTE_CRITERIA;

export type VoteCriterionKey = (typeof VOTE_CRITERIA)[number];
export type PublicCriterionKey = VoteCriterionKey;
export type JudgeCriterionKey = VoteCriterionKey;
