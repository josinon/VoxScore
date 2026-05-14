import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitialSchema1736820000000 } from './database/migrations/1736820000000-InitialSchema';
import { Candidate } from './entities/candidate.entity';
import { User } from './entities/user.entity';
import { Vote } from './entities/vote.entity';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { CandidatesModule } from './candidates/candidates.module';
import { VotingModule } from './voting/voting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
          entities: [User, Candidate, Vote],
          migrations: [InitialSchema1736820000000],
          migrationsTableName: 'typeorm_migrations',
          /** Predefinição: aplica migrações pendentes ao arrancar. Em K8s com várias réplicas use `TYPEORM_MIGRATIONS_RUN=false` e um Job. */
          migrationsRun:
            config.get<string>('TYPEORM_MIGRATIONS_RUN') !== 'false',
          synchronize: false,
        };
      },
      inject: [ConfigService],
    }),
    HealthModule,
    UsersModule,
    CandidatesModule,
    VotingModule,
  ],
})
export class AppModule {}
