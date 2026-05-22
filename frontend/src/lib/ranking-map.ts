import type { RankingEntryDto } from './api';
import type { Artist, RankingRow } from '../app/types';

const PLACEHOLDER_PHOTO =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';

export function mapRankingEntriesToRows(
  entries: RankingEntryDto[],
  candidates: Artist[],
  resultsPublished: boolean,
  viewerIsAdmin = false,
): RankingRow[] {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const exposeScores = resultsPublished || viewerIsAdmin;
  return entries.map((e) => {
    const c = byId.get(e.candidateId);
    const showScores = exposeScores && e.finalScore != null;
    return {
      rank: showScores ? e.rank : 0,
      artistId: e.candidateId,
      name: e.candidateName,
      song: c?.song ?? '—',
      image: c?.image ?? PLACEHOLDER_PHOTO,
      voteCount: e.voteCount,
      judgeScore: e.judgeCompositeAverage ?? 0,
      publicScore: e.publicCompositeAverage ?? 0,
      totalScore: e.finalScore ?? 0,
      showScores,
    };
  });
}
