import type { DataSource } from 'typeorm';

/**
 * Garante `UQ_votes_user_candidate` na base de testes.
 * Load tests ou restores podem remover a constraint; a migração 1737100000000
 * já consta como aplicada e não volta a correr.
 */
export async function ensureVotesUserCandidateUnique(
  ds: DataSource,
): Promise<void> {
  await ds.query(`
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

  await ds.query(`
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
