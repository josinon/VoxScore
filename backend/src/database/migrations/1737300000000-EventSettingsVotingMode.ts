import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventSettingsVotingMode1737300000000
  implements MigrationInterface
{
  name = 'EventSettingsVotingMode1737300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_settings"
      ADD COLUMN "votingMode" character varying(32) NOT NULL DEFAULT 'JUDGES_AND_PUBLIC'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_settings" DROP COLUMN "votingMode"
    `);
  }
}
