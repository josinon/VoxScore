import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Candidate } from '../entities/candidate.entity';
import { User } from '../entities/user.entity';
import { Vote } from '../entities/vote.entity';
import { InitialSchema1736820000000 } from './migrations/1736820000000-InitialSchema';

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
  entities: [User, Candidate, Vote],
  migrations: [InitialSchema1736820000000],
  migrationsTableName: 'typeorm_migrations',
};

export default new DataSource(dataSourceOptions);
