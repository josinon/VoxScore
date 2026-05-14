import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { SignOptions } from 'jsonwebtoken';
import { User } from '../entities/user.entity';
import { AuthDevController } from './auth-dev.controller';
import { AuthOAuthController } from './auth-oauth.controller';
import { AuthService } from './auth.service';
import { GoogleOAuthEnabledGuard } from './google-oauth-enabled.guard';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = (config.get<string>('JWT_EXPIRES_IN') ??
          '15m') as SignOptions['expiresIn'];
        return {
          secret: config.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthDevController, AuthOAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GoogleOAuthEnabledGuard,
  ],
  exports: [JwtModule, PassportModule, AuthService],
})
export class AuthModule {}
