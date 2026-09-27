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
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
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

  async findAllForAdmin(
    query: ListUsersQueryDto = {},
  ): Promise<PaginatedUsersResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;

    const qb = this.users.createQueryBuilder('user');

    if (query.q) {
      qb.andWhere(
        '(LOWER(user.email) LIKE :q OR LOWER(user.displayName) LIKE :q)',
        { q: `%${query.q.toLowerCase()}%` },
      );
    }
    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }
    if (query.disabled !== undefined) {
      qb.andWhere('user.disabled = :disabled', { disabled: query.disabled });
    }

    qb.orderBy('user.createdAt', 'ASC').addOrderBy('user.id', 'ASC');

    const [rows, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const dto = new PaginatedUsersResponseDto();
    dto.schemaVersion = 1;
    dto.items = rows.map((u) => this.toMeResponse(u));
    dto.total = total;
    dto.page = page;
    dto.limit = limit;
    dto.totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return dto;
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
