export interface Artist {
  id: string;
  name: string;
  song: string;
  genre: string;
  image: string;
  bio: string;
  /** Votação aberta para este candidato (servidor). */
  votingOpen: boolean;
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
  judgeScore: number;
  publicScore: number;
  totalScore: number;
  /** Se omitido, a UI não mostra contagem de votos. */
  judgeVotes?: number;
  publicVotes?: number;
}
