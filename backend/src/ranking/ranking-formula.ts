import { UserRole } from '../common/user-role.enum';
import {
  JUDGE_VOTE_CRITERIA,
  PUBLIC_VOTE_CRITERIA,
} from '../voting/voting.constants';

/**
 * Ponderação do ranking (README §5 — Megadance 2026; DEVSPEC §4.2 `RankingModule`).
 * Score final com **os dois grupos**: `0.6 * média_jurados + 0.4 * média_público`.
 */
export const RANKING_JUDGE_WEIGHT = 0.6;

/** Complemento de {@link RANKING_JUDGE_WEIGHT} (jurados + público = 100%). */
export const RANKING_PUBLIC_WEIGHT = 0.4;

export interface RankingCandidateInput {
  id: string;
  name: string;
}

/** Voto já associado a candidato e papel do votante (para testes e agregação). */
export interface RankingVoteInput {
  candidateId: string;
  userRole: string;
  criteriaScores: Record<string, number>;
}

export interface RankingLeaderboardRow {
  rank: number;
  candidateId: string;
  candidateName: string;
  /** Média das médias por voto (média dos 5 critérios por voto de jurado); `null` se não houver votos de jurados. */
  judgeCompositeAverage: number | null;
  /** Idem para 4 critérios do público; `null` se não houver votos públicos. */
  publicCompositeAverage: number | null;
  /**
   * Com ambos os grupos: `RANKING_JUDGE_WEIGHT * judge + RANKING_PUBLIC_WEIGHT * public`.
   * Só um grupo: usa **só a média desse grupo** (o outro lado não entra como zero — evita penalizar candidatos sem jurados ou sem público).
   * Sem votos: **0**.
   */
  finalScore: number;
  judgeCriteriaAverages: Record<string, number> | null;
  publicCriteriaAverages: Record<string, number> | null;
}

export function roundScore4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function arithmeticMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function compositeForJudgeVote(scores: Record<string, number>): number {
  const vals = JUDGE_VOTE_CRITERIA.map((k) => scores[k]);
  return arithmeticMean(vals);
}

function compositeForPublicVote(scores: Record<string, number>): number {
  const vals = PUBLIC_VOTE_CRITERIA.map((k) => scores[k]);
  return arithmeticMean(vals);
}

function criterionAverages(
  votes: RankingVoteInput[],
  keys: readonly string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of keys) {
    const vals = votes.map((v) => v.criteriaScores[k]);
    out[k] = roundScore4(arithmeticMean(vals));
  }
  return out;
}

function aggregateCandidate(
  candidate: RankingCandidateInput,
  votes: RankingVoteInput[],
): Omit<RankingLeaderboardRow, 'rank'> {
  const judgeVotes = votes.filter((v) => v.userRole === UserRole.JUDGE);
  const publicVotes = votes.filter((v) => v.userRole === UserRole.PUBLIC);

  const judgeComposites = judgeVotes.map((v) =>
    compositeForJudgeVote(v.criteriaScores),
  );
  const publicComposites = publicVotes.map((v) =>
    compositeForPublicVote(v.criteriaScores),
  );

  const judgeCompositeAverage =
    judgeComposites.length > 0
      ? roundScore4(arithmeticMean(judgeComposites))
      : null;
  const publicCompositeAverage =
    publicComposites.length > 0
      ? roundScore4(arithmeticMean(publicComposites))
      : null;

  let finalRaw: number;
  if (judgeCompositeAverage != null && publicCompositeAverage != null) {
    finalRaw =
      RANKING_JUDGE_WEIGHT * judgeCompositeAverage +
      RANKING_PUBLIC_WEIGHT * publicCompositeAverage;
  } else if (judgeCompositeAverage != null) {
    finalRaw = judgeCompositeAverage;
  } else if (publicCompositeAverage != null) {
    finalRaw = publicCompositeAverage;
  } else {
    finalRaw = 0;
  }

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    judgeCompositeAverage,
    publicCompositeAverage,
    finalScore: roundScore4(finalRaw),
    judgeCriteriaAverages:
      judgeVotes.length > 0
        ? criterionAverages(judgeVotes, JUDGE_VOTE_CRITERIA)
        : null,
    publicCriteriaAverages:
      publicVotes.length > 0
        ? criterionAverages(publicVotes, PUBLIC_VOTE_CRITERIA)
        : null,
  };
}

/**
 * Constrói o leaderboard: só candidatos em `candidates` (p.ex. ativos), ordenação
 * determinística por `finalScore` desc, nome asc, id asc; empates no mesmo `rank` (estilo competição).
 */
export function buildLeaderboard(
  candidates: RankingCandidateInput[],
  votes: RankingVoteInput[],
): RankingLeaderboardRow[] {
  const byCandidate = new Map<string, RankingVoteInput[]>();
  for (const v of votes) {
    const list = byCandidate.get(v.candidateId) ?? [];
    list.push(v);
    byCandidate.set(v.candidateId, list);
  }

  const rows: Omit<RankingLeaderboardRow, 'rank'>[] = candidates.map((c) =>
    aggregateCandidate(c, byCandidate.get(c.id) ?? []),
  );

  const sorted = [...rows].sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    const nameCmp = a.candidateName.localeCompare(b.candidateName);
    if (nameCmp !== 0) {
      return nameCmp;
    }
    return a.candidateId.localeCompare(b.candidateId);
  });

  let rank = 1;
  return sorted.map((row, i) => {
    if (
      i > 0 &&
      row.finalScore < sorted[i - 1]!.finalScore
    ) {
      rank = i + 1;
    }
    return { ...row, rank };
  });
}
