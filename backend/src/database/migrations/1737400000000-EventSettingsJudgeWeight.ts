import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventSettingsJudgeWeight1737400000000
  implements MigrationInterface
{
  name = 'EventSettingsJudgeWeight1737400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_settings"
      ADD COLUMN "judgeWeightPercent" smallint NOT NULL DEFAULT 80
    `);
    await queryRunner.query(`
      ALTER TABLE "event_settings"
      ADD CONSTRAINT "CHK_event_settings_judge_weight"
      CHECK ("judgeWeightPercent" >= 0 AND "judgeWeightPercent" <= 100)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_settings"
      DROP CONSTRAINT "CHK_event_settings_judge_weight"
    `);
    await queryRunner.query(`
      ALTER TABLE "event_settings"
      DROP COLUMN "judgeWeightPercent"
    `);
  }
}
