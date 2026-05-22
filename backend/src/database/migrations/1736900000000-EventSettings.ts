import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventSettings1736900000000 implements MigrationInterface {
  name = 'EventSettings1736900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "event_settings" (
        "id" character varying(64) NOT NULL DEFAULT 'default',
        "rankingPublished" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_event_settings" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "event_settings" ("id", "rankingPublished")
      VALUES ('default', false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "event_settings"`);
  }
}
