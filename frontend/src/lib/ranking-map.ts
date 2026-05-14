import type { RankingEntryDto } from './api';
import type { Artist, RankingRow } from '../app/types';

const PLACEHOLDER_PHOTO =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';

export function mapRankingEntriesToRows(
  entries: RankingEntryDto[],
  candidates: Artist[],
): RankingRow[] {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  return entries.map((e) => {
    const c = byId.get(e.candidateId);
    return {
      rank: e.rank,
      artistId: e.candidateId,
      name: e.candidateName,
      song: c?.song ?? '—',
      image: c?.image ?? PLACEHOLDER_PHOTO,
      judgeScore: e.judgeCompositeAverage ?? 0,
      publicScore: e.publicCompositeAverage ?? 0,
      totalScore: e.finalScore,
    };
  });
}
