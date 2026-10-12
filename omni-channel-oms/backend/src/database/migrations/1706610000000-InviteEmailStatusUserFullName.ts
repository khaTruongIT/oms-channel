import { MigrationInterface, QueryRunner } from 'typeorm';

export class InviteEmailStatusUserFullName1706610000000
  implements MigrationInterface
{
  public readonly name = 'InviteEmailStatusUserFullName1706610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."tenant_invites" 
      ADD COLUMN IF NOT EXISTS "email_status" character varying(20) NOT NULL DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS "email_sent_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "email_error" TEXT;
    `);

    await queryRunner.query(`
      ALTER TABLE "public"."users" 
      ADD COLUMN IF NOT EXISTS "full_name" character varying(255);
    `);

    // Ensure pgcrypto extension is enabled for digest hashing
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // Secure existing pending tokens by hashing with sha256 (one-way operation)
    await queryRunner.query(`
      UPDATE "public"."tenant_invites" 
      SET "token" = encode(digest("token", 'sha256'), 'hex') 
      WHERE "accepted_at" IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tenant_invites_token" 
      ON "public"."tenant_invites" ("token");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tenant_invites_tenant_email" 
      ON "public"."tenant_invites" ("tenant_id", "email");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."idx_tenant_invites_tenant_email";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."idx_tenant_invites_token";
    `);

    await queryRunner.query(`
      ALTER TABLE "public"."users" 
      DROP COLUMN IF EXISTS "full_name";
    `);

    await queryRunner.query(`
      ALTER TABLE "public"."tenant_invites" 
      DROP COLUMN IF EXISTS "email_error",
      DROP COLUMN IF EXISTS "email_sent_at",
      DROP COLUMN IF EXISTS "email_status";
    `);
  }
}
