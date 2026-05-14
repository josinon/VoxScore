export interface Artist {
  id: number;
  name: string;
  song: string;
  genre: string;
  image: string;
  bio: string;
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

export interface Vote {
  artistId: number;
  scores: Record<string, number>;
  voterRole: 'JUDGE' | 'PUBLIC';
  timestamp: number;
}

export interface ArtistScore {
  artistId: number;
  name: string;
  song: string;
  image: string;
  judgeScore: number;
  publicScore: number;
  totalScore: number;
  judgeVotes: number;
  publicVotes: number;
}
