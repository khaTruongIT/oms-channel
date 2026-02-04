import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileFields1706602000000 implements MigrationInterface {
  name = 'AddUserProfileFields1706602000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."users" 
      ADD COLUMN "first_name" character varying(100),
      ADD COLUMN "last_name" character varying(100),
      ADD COLUMN "phone" character varying(20),
      ADD COLUMN "timezone" character varying(50) DEFAULT 'UTC',
      ADD COLUMN "avatar_url" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."users" 
      DROP COLUMN "avatar_url",
      DROP COLUMN "timezone",
      DROP COLUMN "phone",
      DROP COLUMN "last_name",
      DROP COLUMN "first_name"
    `);
  }
}
