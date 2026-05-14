import {
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { DevTokenDto } from './dto/dev-token.dto';

/**
 * Emite JWT para um email existente. **Desativado por defeito.**
 * Ativar só em desenvolvimento/CI com `AUTH_DEV_TOKEN_ENABLED=true`.
 * Será substituído pelo fluxo OAuth (Fase 3) para novos ambientes; o mock `POST /auth/oauth/mock` cobre testes sem Google.
 */
@Controller('auth')
export class AuthDevController {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  @Post('dev/token')
  @HttpCode(200)
  async devToken(@Body() body: DevTokenDto) {
    if (this.config.get<string>('AUTH_DEV_TOKEN_ENABLED') !== 'true') {
      throw new NotFoundException();
    }
    const user = await this.users.findOne({ where: { email: body.email } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.disabled) {
      throw new UnauthorizedException('User disabled');
    }
    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return { accessToken };
  }
}
