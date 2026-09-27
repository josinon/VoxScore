import { UserRole } from '../common/user-role.enum';
import { VotingMode } from '../common/voting-mode.enum';
import { VOTE_CRITERIA } from '../voting/voting.constants';

/**
 * Ponderação padrão do ranking quando o modo é {@link VotingMode.JUDGES_AND_PUBLIC}.
 * Pode ser sobrescrita por `judgeWeightPercent` em event_settings.
 */
export const RANKING_JUDGE_WEIGHT = 0.8;

/** Complemento de {@link RANKING_JUDGE_WEIGHT} (jurados + público = 100%). */
export const RANKING_PUBLIC_WEIGHT = 0.2;

export type RankingWeights = {
  /** Fração 0–1 (ex.: 0.8 = 80%). */
  judgeWeight: number;
  /** Fração 0–1; deve complementar `judgeWeight`. */
  publicWeight: number;
};

export function weightsFromPercent(judgeWeightPercent: number): RankingWeights {
  const clamped = Math.max(0, Math.min(100, judgeWeightPercent));
  return {
    judgeWeight: clamped / 100,
    publicWeight: (100 - clamped) / 100,
  };
}

export interface RankingCandidateInput {
  id: string;
  name: string;
  /** Desconto aplicado à nota calculada (0 = sem penalidade). */
  scorePenalty?: number;
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
  /** Média das médias por voto (média dos 4 critérios por voto de jurado); `null` se não houver votos de jurados. */
  judgeCompositeAverage: number | null;
  /** Idem para 4 critérios do público; `null` se não houver votos públicos. */
  publicCompositeAverage: number | null;
  /**
   * Depende do {@link VotingMode}:
   * - JUDGES_AND_PUBLIC: pesos configuráveis quando ambos existem; senão a média do grupo presente.
   * - PUBLIC_ONLY / JUDGES_ONLY: só a média desse grupo.
   * Sem votos relevantes: **0**. Antes de aplicar {@link scorePenalty}.
   */
  computedScore: number;
  /** Desconto administrativo subtraído de {@link computedScore}. */
  scorePenalty: number;
  /**
   * `max(0, computedScore - scorePenalty)`; usado para ordenação do pódio.
   */
  finalScore: number;
  judgeCriteriaAverages: Record<string, number> | null;
  publicCriteriaAverages: Record<string, number> | null;
}

export function roundScore4(n: number): number {
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round(n * 10000) / 10000;
}

function arithmeticMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function compositeForVote(scores: Record<string, number>): number | null {
  const vals = VOTE_CRITERIA.map((k) => scores[k]).filter(
    (n): n is number => typeof n === 'number' && Number.isFinite(n),
  );
  if (vals.length === 0) {
    return null;
  }
  return arithmeticMean(vals);
}

function criterionAverages(
  votes: RankingVoteInput[],
  keys: readonly string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of keys) {
    const vals = votes
      .map((v) => v.criteriaScores[k])
      .filter(
        (n): n is number => typeof n === 'number' && Number.isFinite(n),
      );
    if (vals.length === 0) {
      continue;
    }
    out[k] = roundScore4(arithmeticMean(vals));
  }
  return out;
}

function votesForMode(
  votes: RankingVoteInput[],
  mode: VotingMode,
): RankingVoteInput[] {
  if (mode === VotingMode.PUBLIC_ONLY) {
    return votes.filter((v) => v.userRole === UserRole.PUBLIC);
  }
  if (mode === VotingMode.JUDGES_ONLY) {
    return votes.filter((v) => v.userRole === UserRole.JUDGE);
  }
  return votes.filter(
    (v) => v.userRole === UserRole.PUBLIC || v.userRole === UserRole.JUDGE,
  );
}

function aggregateCandidate(
  candidate: RankingCandidateInput,
  votes: RankingVoteInput[],
  mode: VotingMode,
  weights: RankingWeights,
): Omit<RankingLeaderboardRow, 'rank'> {
  const relevant = votesForMode(votes, mode);
  const includeJudges = mode !== VotingMode.PUBLIC_ONLY;
  const includePublic = mode !== VotingMode.JUDGES_ONLY;

  const judgeVotes = includeJudges
    ? relevant.filter((v) => v.userRole === UserRole.JUDGE)
    : [];
  const publicVotes = includePublic
    ? relevant.filter((v) => v.userRole === UserRole.PUBLIC)
    : [];

  const judgeComposites = judgeVotes
    .map((v) => compositeForVote(v.criteriaScores))
    .filter((n): n is number => n != null);
  const publicComposites = publicVotes
    .map((v) => compositeForVote(v.criteriaScores))
    .filter((n): n is number => n != null);

  const judgeCompositeAverage =
    judgeComposites.length > 0
      ? roundScore4(arithmeticMean(judgeComposites))
      : null;
  const publicCompositeAverage =
    publicComposites.length > 0
      ? roundScore4(arithmeticMean(publicComposites))
      : null;

  let finalRaw: number;
  if (mode === VotingMode.PUBLIC_ONLY) {
    finalRaw = publicCompositeAverage ?? 0;
  } else if (mode === VotingMode.JUDGES_ONLY) {
    finalRaw = judgeCompositeAverage ?? 0;
  } else if (judgeCompositeAverage != null && publicCompositeAverage != null) {
    finalRaw =
      weights.judgeWeight * judgeCompositeAverage +
      weights.publicWeight * publicCompositeAverage;
  } else if (judgeCompositeAverage != null) {
    finalRaw = judgeCompositeAverage;
  } else if (publicCompositeAverage != null) {
    finalRaw = publicCompositeAverage;
  } else {
    finalRaw = 0;
  }

  const computedScore = roundScore4(finalRaw);
  const scorePenalty = roundScore4(candidate.scorePenalty ?? 0);
  const finalScore = roundScore4(Math.max(0, computedScore - scorePenalty));

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    judgeCompositeAverage,
    publicCompositeAverage,
    computedScore,
    scorePenalty,
    finalScore,
    judgeCriteriaAverages:
      judgeComposites.length > 0
        ? criterionAverages(judgeVotes, VOTE_CRITERIA)
        : null,
    publicCriteriaAverages:
      publicComposites.length > 0
        ? criterionAverages(publicVotes, VOTE_CRITERIA)
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
  votingMode: VotingMode = VotingMode.JUDGES_AND_PUBLIC,
  weights: RankingWeights = {
    judgeWeight: RANKING_JUDGE_WEIGHT,
    publicWeight: RANKING_PUBLIC_WEIGHT,
  },
): RankingLeaderboardRow[] {
  const byCandidate = new Map<string, RankingVoteInput[]>();
  for (const v of votes) {
    const list = byCandidate.get(v.candidateId) ?? [];
    list.push(v);
    byCandidate.set(v.candidateId, list);
  }

  const rows: Omit<RankingLeaderboardRow, 'rank'>[] = candidates.map((c) =>
    aggregateCandidate(c, byCandidate.get(c.id) ?? [], votingMode, weights),
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
    if (i > 0 && row.finalScore < sorted[i - 1]!.finalScore) {
      rank = i + 1;
    }
    return { ...row, rank };
  });
}

/** Filtra votos a contar em `voteCount` conforme o modo. */
export function filterVotesForMode(
  votes: RankingVoteInput[],
  mode: VotingMode,
): RankingVoteInput[] {
  return votesForMode(votes, mode);
}
