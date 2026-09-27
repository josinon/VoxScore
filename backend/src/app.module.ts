import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitialSchema1736820000000 } from './database/migrations/1736820000000-InitialSchema';
import { EventSettings1736900000000 } from './database/migrations/1736900000000-EventSettings';
import { RestoreVotesUserCandidateUnique1737100000000 } from './database/migrations/1737100000000-RestoreVotesUserCandidateUnique';
import { CandidateScorePenalty1737200000000 } from './database/migrations/1737200000000-CandidateScorePenalty';
import { EventSettingsVotingMode1737300000000 } from './database/migrations/1737300000000-EventSettingsVotingMode';
import { EventSettingsJudgeWeight1737400000000 } from './database/migrations/1737400000000-EventSettingsJudgeWeight';
import { Candidate } from './entities/candidate.entity';
import { EventSettings } from './entities/event-settings.entity';
import { User } from './entities/user.entity';
import { Vote } from './entities/vote.entity';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { CandidatesModule } from './candidates/candidates.module';
import { VotingModule } from './voting/voting.module';
import { RankingModule } from './ranking/ranking.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HttpRequestLoggerInterceptor } from './common/logging/http-request-logger.interceptor';
import {
  databasePoolMax,
  databasePoolMin,
} from './database/database-pool-env';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 2000,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const sslEnabled = config.get<string>('DATABASE_SSL') === 'true';
        return {
          type: 'postgres' as const,
          url: config.get<string>('DATABASE_URL'),
          ssl: sslEnabled
            ? {
                rejectUnauthorized:
                  config.get<string>('DATABASE_SSL_REJECT_UNAUTHORIZED') !==
                  'false',
              }
            : false,
          entities: [User, Candidate, Vote, EventSettings],
          migrations: [
            InitialSchema1736820000000,
            EventSettings1736900000000,
            RestoreVotesUserCandidateUnique1737100000000,
            CandidateScorePenalty1737200000000,
            EventSettingsVotingMode1737300000000,
            EventSettingsJudgeWeight1737400000000,
          ],
          migrationsTableName: 'typeorm_migrations',
          /** Predefinição: aplica migrações pendentes ao arrancar. Em K8s com várias réplicas use `TYPEORM_MIGRATIONS_RUN=false` e um Job. */
          migrationsRun:
            config.get<string>('TYPEORM_MIGRATIONS_RUN') !== 'false',
          synchronize: false,
          extra: {
            max: databasePoolMax(),
            min: databasePoolMin(),
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
          },
        };
      },
      inject: [ConfigService],
    }),
    HealthModule,
    UsersModule,
    CandidatesModule,
    VotingModule,
    RankingModule,
    RealtimeModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: HttpRequestLoggerInterceptor },
  ],
})
export class AppModule {}
