import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1736820000000 implements MigrationInterface {
  name = 'InitialSchema1736820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(320) NOT NULL,
        "displayName" character varying(255) NOT NULL,
        "photoUrl" character varying(2048),
        "role" character varying(32) NOT NULL,
        "disabled" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "candidates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "musicTitle" character varying(255) NOT NULL,
        "genre" character varying(120) NOT NULL,
        "bio" text NOT NULL,
        "photoUrl" character varying(2048) NOT NULL,
        "instagramUrl" character varying(2048),
        "youtubeUrl" character varying(2048),
        "votingOpen" boolean NOT NULL DEFAULT false,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidates" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "votes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "criteriaScores" jsonb NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        CONSTRAINT "PK_votes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_votes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_votes_candidate" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "UQ_votes_user_candidate" UNIQUE ("user_id", "candidate_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "votes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "candidates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
