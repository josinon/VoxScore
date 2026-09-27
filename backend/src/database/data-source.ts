import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Candidate } from '../entities/candidate.entity';
import { CandidatePenalty } from '../entities/candidate-penalty.entity';
import { EventSettings } from '../entities/event-settings.entity';
import { User } from '../entities/user.entity';
import { Vote } from '../entities/vote.entity';
import { InitialSchema1736820000000 } from './migrations/1736820000000-InitialSchema';
import { EventSettings1736900000000 } from './migrations/1736900000000-EventSettings';
import { RestoreVotesUserCandidateUnique1737100000000 } from './migrations/1737100000000-RestoreVotesUserCandidateUnique';
import { CandidateScorePenalty1737200000000 } from './migrations/1737200000000-CandidateScorePenalty';
import { EventSettingsVotingMode1737300000000 } from './migrations/1737300000000-EventSettingsVotingMode';
import { EventSettingsJudgeWeight1737400000000 } from './migrations/1737400000000-EventSettingsJudgeWeight';
import { CandidatePenalties1737500000000 } from './migrations/1737500000000-CandidatePenalties';

loadEnv({ path: process.env.DOTENV_CONFIG_PATH ?? '.env', quiet: true });

const ssl =
  process.env.DATABASE_SSL === 'true'
    ? {
        rejectUnauthorized:
          process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
      }
    : false;

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl,
  entities: [User, Candidate, CandidatePenalty, Vote, EventSettings],
  migrations: [
    InitialSchema1736820000000,
    EventSettings1736900000000,
    RestoreVotesUserCandidateUnique1737100000000,
    CandidateScorePenalty1737200000000,
    EventSettingsVotingMode1737300000000,
    EventSettingsJudgeWeight1737400000000,
    CandidatePenalties1737500000000,
  ],
  migrationsTableName: 'typeorm_migrations',
};

export default new DataSource(dataSourceOptions);
