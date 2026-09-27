import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '../common/user-role.enum';
import { roleCanVoteInMode } from '../common/voting-mode.enum';
import { Candidate } from '../entities/candidate.entity';
import { User } from '../entities/user.entity';
import { Vote } from '../entities/vote.entity';
import { EventSettingsService } from '../ranking/event-settings.service';
import { RankingService } from '../ranking/ranking.service';
import { RealtimeHubService } from '../realtime/realtime-hub.service';
import {
  JUDGE_VOTE_CRITERIA,
  PUBLIC_VOTE_CRITERIA,
} from './voting.constants';
import {
  isValidVoteScore,
  VOTE_SCORE_MAX,
  VOTE_SCORE_MIN,
  VOTE_SCORE_STEP,
} from './vote-score';
import {
  VoteCandidateCacheService,
  type VoteCandidateSnapshot,
} from './vote-candidate-cache.service';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(Vote)
    private readonly votes: Repository<Vote>,
    @InjectRepository(Candidate)
    private readonly candidates: Repository<Candidate>,
    private readonly candidateCache: VoteCandidateCacheService,
    private readonly realtime: RealtimeHubService,
    private readonly ranking: RankingService,
    private readonly eventSettings: EventSettingsService,
  ) {}

  private allowedCriteriaForRole(role: string): readonly string[] {
    if (role === UserRole.PUBLIC) return PUBLIC_VOTE_CRITERIA;
    if (role === UserRole.JUDGE) return JUDGE_VOTE_CRITERIA;
    return [];
  }

  private validateCriteriaScores(
    role: string,
    criteriaScores: Record<string, number>,
  ): void {
    const allowed = this.allowedCriteriaForRole(role);
    if (allowed.length === 0) {
      throw new ForbiddenException('This role cannot submit votes');
    }
    const keys = Object.keys(criteriaScores);
    const allowedSet = new Set(allowed);
    if (keys.length !== allowed.length || !keys.every((k) => allowedSet.has(k))) {
      throw new BadRequestException({
        message:
          'criteriaScores must contain exactly these keys (no more, no less)',
        expectedKeys: [...allowed],
        receivedKeys: keys,
      });
    }
    for (const key of allowed) {
      const v = criteriaScores[key];
      if (!isValidVoteScore(v)) {
        throw new BadRequestException(
          `Each score must be from ${VOTE_SCORE_MIN} to ${VOTE_SCORE_MAX} in steps of ${VOTE_SCORE_STEP} (invalid: ${key}=${String(v)})`,
        );
      }
    }
  }

  /**
   * Utilizador já validado pelo `JwtStrategy` (ativo, não desativado).
   * INSERT síncrono com unique `(user, candidate)`.
   */
  async submitVote(
    candidateId: string,
    userId: string,
    role: string,
    criteriaScores: Record<string, number>,
  ): Promise<Vote> {
    if (role === UserRole.ADMIN) {
      throw new ForbiddenException('Administrators cannot vote');
    }

    const votingMode = await this.eventSettings.getVotingMode();
    if (!roleCanVoteInMode(role, votingMode)) {
      if (votingMode === 'PUBLIC_ONLY') {
        throw new ForbiddenException(
          'Neste evento só o público pode votar',
        );
      }
      if (votingMode === 'JUDGES_ONLY') {
        throw new ForbiddenException(
          'Neste evento só os jurados podem votar',
        );
      }
      throw new ForbiddenException('This role cannot submit votes');
    }

    this.validateCriteriaScores(role, criteriaScores);

    const candidate = await this.resolveCandidateForVote(candidateId);

    const vote = this.votes.create({
      user: { id: userId } as User,
      candidate: { id: candidate.id } as Candidate,
      criteriaScores: { ...criteriaScores },
    });

    try {
      const saved = await this.votes.save(vote);
      await this.ranking.invalidateLeaderboardCache();
      this.realtime.broadcastRankingChanged();
      return saved;
    } catch (e) {
      if (this.isPostgresUniqueViolation(e)) {
        throw new ConflictException(
          'You have already voted for this candidate',
        );
      }
      throw e;
    }
  }

  private async resolveCandidateForVote(
    candidateId: string,
  ): Promise<VoteCandidateSnapshot> {
    const cached = await this.candidateCache.get(candidateId);
    if (cached) {
      this.assertCandidateAllowsVote(cached);
      return cached;
    }

    const row = await this.candidates.findOne({ where: { id: candidateId } });
    if (!row) {
      throw new NotFoundException('Candidate not found');
    }

    const snapshot: VoteCandidateSnapshot = {
      id: row.id,
      active: row.active,
      votingOpen: row.votingOpen,
    };
    await this.candidateCache.set(snapshot);
    this.assertCandidateAllowsVote(snapshot);
    return snapshot;
  }

  private assertCandidateAllowsVote(candidate: VoteCandidateSnapshot): void {
    if (!candidate.active) {
      throw new NotFoundException('Candidate not found');
    }
    if (!candidate.votingOpen) {
      throw new ForbiddenException('Voting is closed for this candidate');
    }
  }

  private isPostgresUniqueViolation(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) {
      return false;
    }
    const q = err as QueryFailedError & {
      code?: string;
      driverError?: { code?: string };
    };
    return (
      q.code === PG_UNIQUE_VIOLATION ||
      q.driverError?.code === PG_UNIQUE_VIOLATION
    );
  }
}
