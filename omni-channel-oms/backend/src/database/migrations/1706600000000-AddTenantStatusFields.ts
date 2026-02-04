import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantStatusFields1706600000000 implements MigrationInterface {
  name = 'AddTenantStatusFields1706600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tenant status enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status_enum') THEN
          CREATE TYPE tenant_status_enum AS ENUM ('pending', 'active', 'suspended', 'cancelled');
        END IF;
      END
      $$;
    `);

    // Add status column
    await queryRunner.query(`
      ALTER TABLE "public"."tenants" 
      ADD COLUMN IF NOT EXISTS "status" tenant_status_enum DEFAULT 'pending'
    `);

    // Add suspended_at column
    await queryRunner.query(`
      ALTER TABLE "public"."tenants" 
      ADD COLUMN IF NOT EXISTS "suspended_at" TIMESTAMP
    `);

    // Add suspended_reason column
    await queryRunner.query(`
      ALTER TABLE "public"."tenants" 
      ADD COLUMN IF NOT EXISTS "suspended_reason" VARCHAR(500)
    `);

    // Add cancelled_at column
    await queryRunner.query(`
      ALTER TABLE "public"."tenants" 
      ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP
    `);

    // Add onboarding_completed column
    await queryRunner.query(`
      ALTER TABLE "public"."tenants" 
      ADD COLUMN IF NOT EXISTS "onboarding_completed" BOOLEAN DEFAULT false
    `);

    // Update existing tenants to 'active' status if they are active
    await queryRunner.query(`
      UPDATE "public"."tenants" 
      SET "status" = 'active', "onboarding_completed" = true 
      WHERE "is_active" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "public"."tenants" DROP COLUMN IF EXISTS "onboarding_completed"
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."tenants" DROP COLUMN IF EXISTS "cancelled_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."tenants" DROP COLUMN IF EXISTS "suspended_reason"
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."tenants" DROP COLUMN IF EXISTS "suspended_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."tenants" DROP COLUMN IF EXISTS "status"
    `);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS tenant_status_enum`);
  }
}
