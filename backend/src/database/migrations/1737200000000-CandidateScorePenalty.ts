import { MigrationInterface, QueryRunner } from 'typeorm';

export class CandidateScorePenalty1737200000000 implements MigrationInterface {
  name = 'CandidateScorePenalty1737200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "candidates"
      ADD COLUMN "scorePenalty" double precision NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "candidates" DROP COLUMN "scorePenalty"
    `);
  }
}
