import { MigrationInterface, QueryRunner } from 'typeorm';

export class CandidatePenalties1737500000000 implements MigrationInterface {
  name = 'CandidatePenalties1737500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "candidate_penalties" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "candidateId" uuid NOT NULL,
        "amount" double precision NOT NULL,
        "reason" character varying(500) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidate_penalties" PRIMARY KEY ("id"),
        CONSTRAINT "FK_candidate_penalties_candidate"
          FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_candidate_penalties_candidate"
      ON "candidate_penalties" ("candidateId")
    `);
    // Migra penalidade única existente para uma linha com motivo genérico.
    await queryRunner.query(`
      INSERT INTO "candidate_penalties" ("candidateId", "amount", "reason")
      SELECT "id", "scorePenalty", 'Penalidade migrada'
      FROM "candidates"
      WHERE "scorePenalty" > 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "candidate_penalties"`);
  }
}
