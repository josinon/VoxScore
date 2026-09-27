import type { Artist } from '../app/types';
import type { CandidateDto } from './api';

export function mapCandidateToArtist(c: CandidateDto): Artist {
  return {
    id: c.id,
    name: c.name,
    song: c.musicTitle,
    genre: c.genre,
    image: c.photoUrl,
    bio: c.bio,
    votingOpen: c.votingOpen,
    active: c.active,
    scorePenalty: c.scorePenalty ?? 0,
    penalties: (c.penalties ?? []).map((p) => ({
      id: p.id,
      amount: p.amount,
      reason: p.reason,
    })),
    displayOrder: c.displayOrder,
    socialMedia: {
      instagram: c.instagramUrl ?? undefined,
      youtube: c.youtubeUrl ?? undefined,
    },
  };
}
