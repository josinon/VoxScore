import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/user-role.enum';
import { Candidate } from '../entities/candidate.entity';
import { RankingService } from '../ranking/ranking.service';
import { RealtimeHubService } from '../realtime/realtime-hub.service';
import { VoteCandidateCacheService } from '../voting/vote-candidate-cache.service';
import { CandidateResponseDto } from './dto/candidate-response.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
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

  private normalizeScorePenalty(value: unknown): number {
    if (value == null) {
      return 0;
    }
    const n = typeof value === 'number' ? value : Number(value);
    this.assertValidScorePenalty(n);
    return n;
  }

  toResponse(c: Candidate): CandidateResponseDto {
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
    dto.scorePenalty = this.normalizeScorePenalty(c.scorePenalty);
    dto.createdAt = c.createdAt;
    dto.updatedAt = c.updatedAt;
    return dto;
  }

  async findAllForAuthenticated(): Promise<CandidateResponseDto[]> {
    const rows = await this.candidates.find({
      where: { active: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((c) => this.toResponse(c));
  }

  /** Lista completa para o painel admin (inclui `active: false`). */
  async findAllForAdmin(): Promise<CandidateResponseDto[]> {
    const rows = await this.candidates.find({
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((c) => this.toResponse(c));
  }

  async findOneById(
    id: string,
    requesterRole: string,
  ): Promise<CandidateResponseDto> {
    const isAdmin = (requesterRole as UserRole) === UserRole.ADMIN;
    const found = await this.candidates.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Candidate not found');
    }
    if (!isAdmin && !found.active) {
      throw new NotFoundException('Candidate not found');
    }
    return this.toResponse(found);
  }

  async create(dto: CreateCandidateDto): Promise<CandidateResponseDto> {
    if (dto.scorePenalty != null) {
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
      scorePenalty: dto.scorePenalty ?? 0,
    });
    const saved = await this.candidates.save(entity);
    await this.invalidateRankingCache();
    this.realtime.broadcastCandidatesChanged();
    return this.toResponse(saved);
  }

  async update(
    id: string,
    dto: UpdateCandidateDto,
  ): Promise<CandidateResponseDto> {
    const found = await this.candidates.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Candidate not found');
    }
    if (dto.scorePenalty != null) {
      this.assertValidScorePenalty(dto.scorePenalty);
    }
    this.candidates.merge(found, dto);
    const saved = await this.candidates.save(found);
    await this.invalidateVoteCandidateCache(id);
    await this.invalidateRankingCache();
    this.realtime.broadcastCandidatesChanged();
    return this.toResponse(saved);
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

  /** Abre ou fecha a votação para um candidato. */
  async setVotingOpen(id: string, open: boolean): Promise<CandidateResponseDto> {
    const found = await this.candidates.findOne({ where: { id } });
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
