import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/user-role.enum';
import { Candidate } from '../entities/candidate.entity';
import { CandidateResponseDto } from './dto/candidate-response.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidates: Repository<Candidate>,
  ) {}

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
    });
    const saved = await this.candidates.save(entity);
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
    this.candidates.merge(found, dto);
    const saved = await this.candidates.save(found);
    return this.toResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const res = await this.candidates.delete({ id });
    if (res.affected === 0) {
      throw new NotFoundException('Candidate not found');
    }
  }
}
