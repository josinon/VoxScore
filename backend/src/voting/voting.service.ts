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
import { Candidate } from '../entities/candidate.entity';
import { User } from '../entities/user.entity';
import { Vote } from '../entities/vote.entity';
import {
  JUDGE_VOTE_CRITERIA,
  PUBLIC_VOTE_CRITERIA,
} from './voting.constants';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(Vote)
    private readonly votes: Repository<Vote>,
    @InjectRepository(Candidate)
    private readonly candidates: Repository<Candidate>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
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
      if (!Number.isInteger(v) || v < 1 || v > 10) {
        throw new BadRequestException(
          `Each score must be an integer from 1 to 10 (invalid: ${key}=${String(v)})`,
        );
      }
    }
  }

  async submitVote(
    candidateId: string,
    userId: string,
    role: string,
    criteriaScores: Record<string, number>,
  ): Promise<Vote> {
    if (role === UserRole.ADMIN) {
      throw new ForbiddenException('Administrators cannot vote');
    }

    const candidate = await this.candidates.findOne({
      where: { id: candidateId },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    if (!candidate.active) {
      throw new NotFoundException('Candidate not found');
    }
    if (!candidate.votingOpen) {
      throw new ForbiddenException('Voting is closed for this candidate');
    }

    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || user.disabled) {
      throw new ForbiddenException();
    }

    this.validateCriteriaScores(role, criteriaScores);

    const vote = this.votes.create({
      user,
      candidate,
      criteriaScores: { ...criteriaScores },
    });

    try {
      return await this.votes.save(vote);
    } catch (e) {
      if (this.isPostgresUniqueViolation(e)) {
        throw new ConflictException(
          'You have already voted for this candidate',
        );
      }
      throw e;
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
