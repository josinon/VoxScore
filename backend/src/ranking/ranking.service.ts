import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '../common/user-role.enum';
import { Candidate } from '../entities/candidate.entity';
import { Vote } from '../entities/vote.entity';
import { RankingEntryDto, RankingResponseDto } from './dto/ranking-response.dto';
import { EventSettingsService } from './event-settings.service';
import { buildLeaderboard, type RankingVoteInput } from './ranking-formula';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidates: Repository<Candidate>,
    @InjectRepository(Vote)
    private readonly votes: Repository<Vote>,
    private readonly eventSettings: EventSettingsService,
  ) {}

  async getLeaderboard(viewerRole: string): Promise<RankingResponseDto> {
    const resultsPublished = await this.eventSettings.isRankingPublished();
    const showScores =
      resultsPublished || viewerRole === UserRole.ADMIN;

    const activeCandidates = await this.candidates.find({
      where: { active: true },
      order: { displayOrder: 'ASC', name: 'ASC', id: 'ASC' },
    });

    const dto = new RankingResponseDto();
    dto.schemaVersion = 1;
    dto.resultsPublished = resultsPublished;

    if (activeCandidates.length === 0) {
      dto.entries = [];
      return dto;
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

    if (showScores) {
      const rows = buildLeaderboard(
        activeCandidates.map((c) => ({ id: c.id, name: c.name })),
        voteInputs,
      );
      dto.entries = rows.map((r) => {
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
      return dto;
    }

    dto.entries = activeCandidates.map((c) => {
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
    return dto;
  }

  async setRankingPublished(published: boolean): Promise<boolean> {
    return this.eventSettings.setRankingPublished(published);
  }
}
