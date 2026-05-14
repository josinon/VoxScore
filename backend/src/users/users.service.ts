import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { MeResponseDto } from './dto/me-response.dto';
import { UserRole } from '../common/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async getMe(userId: string): Promise<MeResponseDto> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
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
}
