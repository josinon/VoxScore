import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Profile } from 'passport-google-oauth20';
import { Repository } from 'typeorm';
import { UserRole } from '../common/user-role.enum';
import { User } from '../entities/user.entity';
import type { GoogleOAuthMockDto } from './dto/google-oauth-mock.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  issueAccessToken(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }

  async findOrCreateFromGoogleProfile(profile: Profile): Promise<User> {
    const email = profile.emails?.[0]?.value?.toLowerCase().trim();
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }
    const displayName = this.displayNameFromGoogle(profile, email);
    const photoUrl = profile.photos?.[0]?.value ?? null;
    return this.findOrCreateOAuthUser(email, displayName, photoUrl);
  }

  async findOrCreateFromMockProfile(dto: GoogleOAuthMockDto): Promise<User> {
    const email = dto.email.toLowerCase().trim();
    const displayName = (dto.displayName ?? email.split('@')[0]).trim();
    const photoUrl = dto.photoUrl ?? null;
    return this.findOrCreateOAuthUser(email, displayName, photoUrl);
  }

  private displayNameFromGoogle(profile: Profile, email: string): string {
    const fromProfile = profile.displayName?.trim();
    if (fromProfile) {
      return fromProfile.slice(0, 255);
    }
    const gn = profile.name?.givenName?.trim() ?? '';
    const fn = profile.name?.familyName?.trim() ?? '';
    const combined = `${gn} ${fn}`.trim();
    if (combined) {
      return combined.slice(0, 255);
    }
    return email.split('@')[0].slice(0, 255);
  }

  private async findOrCreateOAuthUser(
    email: string,
    displayName: string,
    photoUrl: string | null,
  ): Promise<User> {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      return existing;
    }
    try {
      return await this.users.save(
        this.users.create({
          email,
          displayName: displayName.slice(0, 255),
          photoUrl,
          role: UserRole.PUBLIC,
          disabled: false,
        }),
      );
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === '23505') {
        const again = await this.users.findOne({ where: { email } });
        if (again) {
          return again;
        }
      }
      throw new BadRequestException('Could not create user');
    }
  }
}
