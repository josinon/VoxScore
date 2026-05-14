import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UserRole } from '../common/user-role.enum';
import { User } from '../entities/user.entity';
import { MeResponseDto } from './dto/me-response.dto';
import { PatchUserDto } from './dto/patch-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  private toMeResponse(user: User): MeResponseDto {
    const dto = new MeResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.displayName = user.displayName;
    dto.photoUrl = user.photoUrl;
    dto.role = user.role as UserRole;
    dto.disabled = user.disabled;
    dto.createdAt = user.createdAt;
    return dto;
  }

  async getMe(userId: string): Promise<MeResponseDto> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toMeResponse(user);
  }

  async findAllForAdmin(): Promise<MeResponseDto[]> {
    const rows = await this.users.find({
      order: { createdAt: 'ASC' },
    });
    return rows.map((u) => this.toMeResponse(u));
  }

  async patchUserAsAdmin(id: string, dto: PatchUserDto): Promise<MeResponseDto> {
    if (dto.role === undefined && dto.disabled === undefined) {
      throw new BadRequestException('Provide at least one of: role, disabled');
    }

    const target = await this.users.findOne({ where: { id } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const becomesNonAdmin =
      dto.role !== undefined && dto.role !== UserRole.ADMIN;
    const disabling = dto.disabled === true;

    if (target.role === UserRole.ADMIN && (becomesNonAdmin || disabling)) {
      const otherActiveAdmins = await this.users.count({
        where: {
          role: UserRole.ADMIN,
          disabled: false,
          id: Not(id),
        },
      });
      if (otherActiveAdmins < 1) {
        throw new ForbiddenException(
          'Cannot demote or disable the last administrator',
        );
      }
    }

    if (dto.role !== undefined) {
      target.role = dto.role;
    }
    if (dto.disabled !== undefined) {
      target.disabled = dto.disabled;
    }

    const saved = await this.users.save(target);
    return this.toMeResponse(saved);
  }
}
