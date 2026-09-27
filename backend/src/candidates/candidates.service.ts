import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/user-role.enum';
import { Candidate } from '../entities/candidate.entity';
import { CandidatePenalty } from '../entities/candidate-penalty.entity';
import { RankingService } from '../ranking/ranking.service';
import { RealtimeHubService } from '../realtime/realtime-hub.service';
import { VoteCandidateCacheService } from '../voting/vote-candidate-cache.service';
import { CandidatePenaltyDto } from './dto/candidate-penalty.dto';
import { CandidateResponseDto } from './dto/candidate-response.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CreateCandidatePenaltyDto } from './dto/create-candidate-penalty.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import {
  isValidScorePenalty,
  SCORE_PENALTY_MAX,
  SCORE_PENALTY_MIN,
  VOTE_SCORE_STEP,
} from '../voting/vote-score';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidates: Repository<Candidate>,
    @InjectRepository(CandidatePenalty)
    private readonly penalties: Repository<CandidatePenalty>,
    private readonly realtime: RealtimeHubService,
    private readonly ranking: RankingService,
    private readonly voteCandidateCache: VoteCandidateCacheService,
  ) {}

  private async invalidateRankingCache(): Promise<void> {
    await this.ranking.invalidateLeaderboardCache();
  }

  private async invalidateVoteCandidateCache(candidateId: string): Promise<void> {
    await this.voteCandidateCache.invalidate(candidateId);
  }

  private assertValidScorePenalty(value: number): void {
    if (!isValidScorePenalty(value)) {
      throw new BadRequestException(
        `scorePenalty must be from ${SCORE_PENALTY_MIN} to ${SCORE_PENALTY_MAX} in steps of ${VOTE_SCORE_STEP} (invalid: ${String(value)})`,
      );
    }
  }

  private assertValidPenaltyAmount(value: number): void {
    if (!isValidScorePenalty(value) || value < VOTE_SCORE_STEP) {
      throw new BadRequestException(
        `amount must be from ${VOTE_SCORE_STEP} to ${SCORE_PENALTY_MAX} in steps of ${VOTE_SCORE_STEP} (invalid: ${String(value)})`,
      );
    }
  }

  private toPenaltyDto(p: CandidatePenalty): CandidatePenaltyDto {
    const dto = new CandidatePenaltyDto();
    dto.id = p.id;
    dto.amount = Number(p.amount) || 0;
    dto.reason = p.reason;
    dto.createdAt = p.createdAt;
    return dto;
  }

  private sumPenalties(list: CandidatePenalty[] | undefined): number {
    if (!list?.length) {
      return 0;
    }
    return Math.round(
      list.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) * 10000,
    ) / 10000;
  }

  private async syncScorePenalty(candidateId: string): Promise<number> {
    const rows = await this.penalties.find({ where: { candidateId } });
    const total = this.sumPenalties(rows);
    await this.candidates.update({ id: candidateId }, { scorePenalty: total });
    return total;
  }

  toResponse(
    c: Candidate,
    penaltyRows?: CandidatePenalty[],
  ): CandidateResponseDto {
    const list = penaltyRows ?? c.penalties ?? [];
    const dto = new CandidateResponseDto();
    dto.id = c.id;
    dto.name = c.name;
    dto.musicTitle = c.musicTitle;
    dto.genre = c.genre;
    dto.bio = c.bio;
    dto.photoUrl = c.photoUrl;
    dto.instagramUrl = c.instagramUrl;
    dto.youtubeUrl = c.youtubeUrl;
    dto.votingOpen = c.votingOpen;
    dto.displayOrder = c.displayOrder;
    dto.active = c.active;
    dto.scorePenalty = this.sumPenalties(list);
    dto.penalties = [...list]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((p) => this.toPenaltyDto(p));
    dto.createdAt = c.createdAt;
    dto.updatedAt = c.updatedAt;
    return dto;
  }

  private async loadWithPenalties(
    where: { id?: string; active?: boolean },
  ): Promise<Candidate[]> {
    return this.candidates.find({
      where,
      relations: ['penalties'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async findAllForAuthenticated(): Promise<CandidateResponseDto[]> {
    const rows = await this.candidates.find({
      where: { active: true },
      relations: ['penalties'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((c) => this.toResponse(c));
  }

  async findAllForAdmin(): Promise<CandidateResponseDto[]> {
    const rows = await this.candidates.find({
      relations: ['penalties'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((c) => this.toResponse(c));
  }

  async findOneById(
    id: string,
    requesterRole: string,
  ): Promise<CandidateResponseDto> {
    const isAdmin = (requesterRole as UserRole) === UserRole.ADMIN;
    const found = await this.candidates.findOne({
      where: { id },
      relations: ['penalties'],
    });
    if (!found) {
      throw new NotFoundException('Candidate not found');
    }
    if (!isAdmin && !found.active) {
      throw new NotFoundException('Candidate not found');
    }
    return this.toResponse(found);
  }

  async create(dto: CreateCandidateDto): Promise<CandidateResponseDto> {
    if (dto.scorePenalty != null && dto.scorePenalty > 0) {
      this.assertValidScorePenalty(dto.scorePenalty);
    }
    const entity = this.candidates.create({
      name: dto.name,
      musicTitle: dto.musicTitle,
      genre: dto.genre,
      bio: dto.bio,
      photoUrl: dto.photoUrl,
      instagramUrl: dto.instagramUrl ?? null,
      youtubeUrl: dto.youtubeUrl ?? null,
      votingOpen: dto.votingOpen ?? false,
      displayOrder: dto.displayOrder ?? 0,
      active: dto.active ?? true,
      scorePenalty: 0,
    });
    const saved = await this.candidates.save(entity);
    if (dto.scorePenalty != null && dto.scorePenalty > 0) {
      await this.penalties.save(
        this.penalties.create({
          candidateId: saved.id,
          amount: dto.scorePenalty,
          reason: 'Penalidade inicial',
        }),
      );
      await this.syncScorePenalty(saved.id);
    }
    await this.invalidateRankingCache();
    this.realtime.broadcastCandidatesChanged();
    return this.findOneById(saved.id, UserRole.ADMIN);
  }

  async update(
    id: string,
    dto: UpdateCandidateDto,
  ): Promise<CandidateResponseDto> {
    const found = await this.candidates.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Candidate not found');
    }
    // scorePenalty no PATCH legado é ignorado — use POST/DELETE /penalties.
    const { scorePenalty: _ignored, ...rest } = dto;
    this.candidates.merge(found, rest);
    await this.candidates.save(found);
    await this.invalidateVoteCandidateCache(id);
    await this.invalidateRankingCache();
    this.realtime.broadcastCandidatesChanged();
    return this.findOneById(id, UserRole.ADMIN);
  }

  async addPenalty(
    candidateId: string,
    dto: CreateCandidatePenaltyDto,
  ): Promise<CandidateResponseDto> {
    this.assertValidPenaltyAmount(dto.amount);
    const found = await this.candidates.findOne({ where: { id: candidateId } });
    if (!found) {
      throw new NotFoundException('Candidate not found');
    }
    const reason = dto.reason.trim();
    if (reason.length < 3) {
      throw new BadRequestException('reason must be at least 3 characters');
    }
    await this.penalties.save(
      this.penalties.create({
        candidateId,
        amount: dto.amount,
        reason,
      }),
    );
    await this.syncScorePenalty(candidateId);
    await this.invalidateRankingCache();
    this.realtime.broadcastCandidatesChanged();
    this.realtime.broadcastRankingChanged();
    return this.findOneById(candidateId, UserRole.ADMIN);
  }

  async removePenalty(
    candidateId: string,
    penaltyId: string,
  ): Promise<CandidateResponseDto> {
    const found = await this.candidates.findOne({ where: { id: candidateId } });
    if (!found) {
      throw new NotFoundException('Candidate not found');
    }
    const res = await this.penalties.delete({ id: penaltyId, candidateId });
    if (res.affected === 0) {
      throw new NotFoundException('Penalty not found');
    }
    await this.syncScorePenalty(candidateId);
    await this.invalidateRankingCache();
    this.realtime.broadcastCandidatesChanged();
    this.realtime.broadcastRankingChanged();
    return this.findOneById(candidateId, UserRole.ADMIN);
  }

  async remove(id: string): Promise<void> {
    const res = await this.candidates.delete({ id });
    if (res.affected === 0) {
      throw new NotFoundException('Candidate not found');
    }
    await this.invalidateVoteCandidateCache(id);
    await this.invalidateRankingCache();
    this.realtime.broadcastCandidatesChanged();
  }

  async setVotingOpen(id: string, open: boolean): Promise<CandidateResponseDto> {
    const found = await this.candidates.findOne({
      where: { id },
      relations: ['penalties'],
    });
    if (!found) {
      throw new NotFoundException('Candidate not found');
    }
    found.votingOpen = open;
    const saved = await this.candidates.save(found);
    await this.invalidateVoteCandidateCache(id);
    this.realtime.broadcastCandidatesChanged();
    return this.toResponse(saved);
  }
}
