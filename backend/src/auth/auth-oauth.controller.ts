import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';
import { GoogleOAuthMockDto } from './dto/google-oauth-mock.dto';
import { GoogleOAuthEnabledGuard } from './google-oauth-enabled.guard';
import { authThrottle } from '../common/throttle/throttle-env';

@Controller('auth')
export class AuthOAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Mock de callback Google para CI e desenvolvimento sem credenciais Google.
   * Ativar com `AUTH_GOOGLE_MOCK_ENABLED=true` (desligado por defeito).
   */
  @Post('oauth/mock')
  @Throttle(authThrottle)
  @HttpCode(200)
  async mockOAuth(
    @Body() body: GoogleOAuthMockDto,
  ): Promise<{ accessToken: string }> {
    if (this.config.get<string>('AUTH_GOOGLE_MOCK_ENABLED') !== 'true') {
      throw new NotFoundException();
    }
    const user = await this.authService.findOrCreateFromMockProfile(body);
    const accessToken = await this.authService.issueAccessToken(user.id);
    return { accessToken };
  }

  @Get('google')
  @SkipThrottle()
  @UseGuards(GoogleOAuthEnabledGuard, AuthGuard('google'))
  googleAuth(): void {
    /* Passport envia redirect para o Google */
  }

  @Get('google/callback')
  @SkipThrottle()
  @UseGuards(GoogleOAuthEnabledGuard, AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: User },
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const accessToken = await this.authService.issueAccessToken(req.user.id);
    const frontend = this.config
      .get<string>('OAUTH_FRONTEND_REDIRECT_URL')
      ?.trim();
    if (!frontend) {
      res.status(200).json({ accessToken });
      return;
    }
    const base = frontend.replace(/\/$/, '');
    const url = `${base}#access_token=${encodeURIComponent(accessToken)}`;
    res.redirect(302, url);
  }
}
