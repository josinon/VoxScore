import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Candidate } from '../entities/candidate.entity';
import { Vote } from '../entities/vote.entity';
import { UserRole } from '../common/user-role.enum';
import { RankingEntryDto, RankingResponseDto } from './dto/ranking-response.dto';
import { buildLeaderboard, type RankingVoteInput } from './ranking-formula';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidates: Repository<Candidate>,
    @InjectRepository(Vote)
    private readonly votes: Repository<Vote>,
  ) {}

  async getLeaderboard(): Promise<RankingResponseDto> {
    const activeCandidates = await this.candidates.find({
      where: { active: true },
      order: { displayOrder: 'ASC', name: 'ASC', id: 'ASC' },
    });

    if (activeCandidates.length === 0) {
      const empty = new RankingResponseDto();
      empty.schemaVersion = 1;
      empty.entries = [];
      return empty;
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

    const rows = buildLeaderboard(
      activeCandidates.map((c) => ({ id: c.id, name: c.name })),
      voteInputs,
    );

    const dto = new RankingResponseDto();
    dto.schemaVersion = 1;
    dto.entries = rows.map((r) => {
      const e = new RankingEntryDto();
      e.rank = r.rank;
      e.candidateId = r.candidateId;
      e.candidateName = r.candidateName;
      e.judgeCompositeAverage = r.judgeCompositeAverage;
      e.publicCompositeAverage = r.publicCompositeAverage;
      e.finalScore = r.finalScore;
      e.judgeCriteriaAverages = r.judgeCriteriaAverages;
      e.publicCriteriaAverages = r.publicCriteriaAverages;
      return e;
    });
    return dto;
  }
}
