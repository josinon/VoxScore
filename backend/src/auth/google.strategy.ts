import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID:
        config.get<string>('GOOGLE_CLIENT_ID')?.trim() ||
        '__VOXSCORE_GOOGLE_OAUTH_NOT_CONFIGURED__',
      clientSecret:
        config.get<string>('GOOGLE_CLIENT_SECRET')?.trim() ||
        '__VOXSCORE_GOOGLE_OAUTH_NOT_CONFIGURED__',
      callbackURL:
        config.get<string>('GOOGLE_CALLBACK_URL')?.trim() ||
        'http://127.0.0.1:3000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    return this.authService.findOrCreateFromGoogleProfile(profile);
  }
}
