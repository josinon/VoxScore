/** Formata nota 1–10 em passos de 0,5 para exibição (sempre uma casa decimal → largura estável). */
export function formatVoteScore(score: number): string {
  const snapped = Math.round(score * 2) / 2;
  return snapped.toFixed(1).replace('.', ',');
}
