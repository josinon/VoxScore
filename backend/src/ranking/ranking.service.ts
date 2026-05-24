import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '../common/user-role.enum';
import { Candidate } from '../entities/candidate.entity';
import { Vote } from '../entities/vote.entity';
import { RankingEntryDto, RankingResponseDto } from './dto/ranking-response.dto';
import { EventSettingsService } from './event-settings.service';
import { RankingCacheService, type RankingCacheView } from './ranking-cache.service';
import { buildLeaderboard, type RankingVoteInput } from './ranking-formula';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidates: Repository<Candidate>,
    @InjectRepository(Vote)
    private readonly votes: Repository<Vote>,
    private readonly eventSettings: EventSettingsService,
    private readonly rankingCache: RankingCacheService,
  ) {}

  async getLeaderboard(viewerRole: string): Promise<RankingResponseDto> {
    const resultsPublished = await this.eventSettings.isRankingPublished();
    const view = this.cacheViewForRole(viewerRole, resultsPublished);

    const cached = await this.rankingCache.get(view);
    if (cached && cached.resultsPublished === resultsPublished) {
      return cached;
    }

    const payloads = await this.buildLeaderboardPayloads(resultsPublished);
    await this.rankingCache.set('scores', payloads.scores);
    await this.rankingCache.set('counts', payloads.counts);

    return view === 'scores' ? payloads.scores : payloads.counts;
  }

  async setRankingPublished(published: boolean): Promise<boolean> {
    const ok = await this.eventSettings.setRankingPublished(published);
    await this.rankingCache.invalidate();
    return ok;
  }

  /** Invalida após novo voto ou alteração a candidatos no leaderboard. */
  async invalidateLeaderboardCache(): Promise<void> {
    await this.rankingCache.invalidate();
  }

  private cacheViewForRole(
    viewerRole: string,
    resultsPublished: boolean,
  ): RankingCacheView {
    if (viewerRole === UserRole.ADMIN || resultsPublished) {
      return 'scores';
    }
    return 'counts';
  }

  private async buildLeaderboardPayloads(
    resultsPublished: boolean,
  ): Promise<{ scores: RankingResponseDto; counts: RankingResponseDto }> {
    const activeCandidates = await this.candidates.find({
      where: { active: true },
      order: { displayOrder: 'ASC', name: 'ASC', id: 'ASC' },
    });

    const scores = new RankingResponseDto();
    scores.schemaVersion = 1;
    scores.resultsPublished = resultsPublished;

    const counts = new RankingResponseDto();
    counts.schemaVersion = 1;
    counts.resultsPublished = resultsPublished;

    if (activeCandidates.length === 0) {
      scores.entries = [];
      counts.entries = [];
      return { scores, counts };
    }

    const ids = activeCandidates.map((c) => c.id);
    const voteRows = await this.votes.find({
      where: { candidate: { id: In(ids) } },
      relations: ['user', 'candidate'],
    });

    const voteInputs: RankingVoteInput[] = [];
    for (const v of voteRows) {
      const role = v.user.role;
      if (role !== UserRole.PUBLIC && role !== UserRole.JUDGE) {
        continue;
      }
      voteInputs.push({
        candidateId: v.candidate.id,
        userRole: role,
        criteriaScores: v.criteriaScores,
      });
    }

    const votesByCandidate = new Map<string, RankingVoteInput[]>();
    for (const v of voteInputs) {
      const list = votesByCandidate.get(v.candidateId) ?? [];
      list.push(v);
      votesByCandidate.set(v.candidateId, list);
    }

    const rows = buildLeaderboard(
      activeCandidates.map((c) => ({ id: c.id, name: c.name })),
      voteInputs,
    );

    scores.entries = rows.map((r) => {
      const votesForCandidate = votesByCandidate.get(r.candidateId) ?? [];
      const e = new RankingEntryDto();
      e.rank = r.rank;
      e.candidateId = r.candidateId;
      e.candidateName = r.candidateName;
      e.voteCount = votesForCandidate.length;
      e.judgeCompositeAverage = r.judgeCompositeAverage;
      e.publicCompositeAverage = r.publicCompositeAverage;
      e.finalScore = r.finalScore;
      e.judgeCriteriaAverages = r.judgeCriteriaAverages;
      e.publicCriteriaAverages = r.publicCriteriaAverages;
      return e;
    });

    counts.entries = activeCandidates.map((c) => {
      const votesForCandidate = votesByCandidate.get(c.id) ?? [];
      const e = new RankingEntryDto();
      e.rank = 0;
      e.candidateId = c.id;
      e.candidateName = c.name;
      e.voteCount = votesForCandidate.length;
      e.judgeCompositeAverage = null;
      e.publicCompositeAverage = null;
      e.finalScore = null;
      e.judgeCriteriaAverages = null;
      e.publicCriteriaAverages = null;
      return e;
    });

    return { scores, counts };
  }
}
