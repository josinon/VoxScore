import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../common/user-role.enum';

/**
 * Garante pelo menos um utilizador ADMIN quando a base ainda não tem nenhum.
 * Política documentada em `backend/README.md` (secção «Primeiro administrador»).
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const adminCount = await this.users.count({
      where: { role: UserRole.ADMIN },
    });
    if (adminCount > 0) {
      return;
    }
    const email =
      this.config.get<string>('BOOTSTRAP_ADMIN_EMAIL') ??
      'admin@voxscore.local';
    const displayName =
      this.config.get<string>('BOOTSTRAP_ADMIN_DISPLAY_NAME') ??
      'Administrator';
    await this.users.save(
      this.users.create({
        email,
        displayName,
        photoUrl: null,
        role: UserRole.ADMIN,
        disabled: false,
      }),
    );
    this.logger.log(`Created bootstrap ADMIN user (${email}).`);
  }
}
