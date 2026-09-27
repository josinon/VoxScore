export interface Artist {
  id: string;
  name: string;
  song: string;
  genre: string;
  image: string;
  bio: string;
  /** Votação aberta para este candidato (servidor). */
  votingOpen: boolean;
  /** Candidato visível na votação pública (`GET /candidates`). */
  active: boolean;
  /** Soma das penalidades (0 = sem penalidade). */
  scorePenalty: number;
  /** Penalidades individuais com motivo. */
  penalties: { id: string; amount: number; reason: string }[];
  displayOrder?: number;
  socialMedia: {
    instagram?: string;
    youtube?: string;
  };
}

export interface Criterion {
  id: string;
  name: string;
  description: string;
}

/** Voto local simulado (área admin / demonstração). */
export interface Vote {
  artistId: string;
  scores: Record<string, number>;
  voterRole: 'JUDGE' | 'PUBLIC';
  timestamp: number;
}

/** Linha do ranking para UI (API + fotos da lista de candidatos). */
export interface RankingRow {
  rank: number;
  artistId: string;
  name: string;
  song: string;
  image: string;
  /** Total de pessoas que avaliaram (jurados + público). */
  voteCount: number;
  judgeScore: number;
  publicScore: number;
  /** Nota calculada pelos votos, antes da penalidade. */
  computedScore: number;
  /** Penalidade administrativa (0 = nenhuma). */
  scorePenalty: number;
  /** Detalhe das penalidades (motivo + valor). */
  penalties: { amount: number; reason: string }[];
  /** Nota final após penalidade (usada no pódio). */
  totalScore: number;
  /** Quando `false`, a UI mostra só `voteCount` (sem notas nem pódio). */
  showScores: boolean;
}
