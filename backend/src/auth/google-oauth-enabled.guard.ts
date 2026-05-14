import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Bloqueia as rotas Google OAuth quando faltam variáveis de ambiente,
 * em vez de deixar o Passport falhar de forma opaca.
 */
@Injectable()
export class GoogleOAuthEnabledGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    const id = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim();
    const secret = this.config.get<string>('GOOGLE_CLIENT_SECRET')?.trim();
    const callback = this.config.get<string>('GOOGLE_CALLBACK_URL')?.trim();
    if (!id || !secret || !callback) {
      throw new NotFoundException(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL.',
      );
    }
    return true;
  }
}
