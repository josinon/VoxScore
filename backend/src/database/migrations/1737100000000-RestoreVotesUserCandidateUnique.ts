import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Repõe `UQ_votes_user_candidate` se tiver sido removida (ex.: restores parciais, load tests).
 * Falha se existirem linhas duplicadas — limpe com `load-tests/cleanup-load-test.sql` ou equivalente.
 */
export class RestoreVotesUserCandidateUnique1737100000000
  implements MigrationInterface
{
  name = 'RestoreVotesUserCandidateUnique1737100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "votes" v
      USING (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY user_id, candidate_id
            ORDER BY "createdAt" ASC, id ASC
          ) AS rn
        FROM "votes"
      ) ranked
      WHERE v.id = ranked.id AND ranked.rn > 1
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          WHERE t.relname = 'votes'
            AND c.conname = 'UQ_votes_user_candidate'
        ) THEN
          ALTER TABLE "votes"
            ADD CONSTRAINT "UQ_votes_user_candidate"
            UNIQUE ("user_id", "candidate_id");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "votes"
        DROP CONSTRAINT IF EXISTS "UQ_votes_user_candidate"
    `);
  }
}
