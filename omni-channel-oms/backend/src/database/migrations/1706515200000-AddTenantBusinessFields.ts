import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantBusinessFields1706515200000 implements MigrationInterface {
  name = 'AddTenantBusinessFields1706515200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums first (with IF NOT EXISTS logic)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE business_type_enum AS ENUM ('retail', 'wholesale', 'distributor', 'manufacturer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE tenant_plan_enum AS ENUM ('free', 'starter', 'professional', 'enterprise');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Helper function to add column if not exists
    const addColumnIfNotExists = async (
      column: string,
      type: string,
      defaultValue?: string,
    ) => {
      const hasColumn = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'tenants' 
          AND column_name = '${column}'
        );
      `);

      if (!hasColumn[0].exists) {
        const defaultClause = defaultValue ? ` DEFAULT ${defaultValue}` : '';
        await queryRunner.query(
          `ALTER TABLE "tenants" ADD "${column}" ${type}${defaultClause}`,
        );
      }
    };

    // Contact Information columns
    await addColumnIfNotExists('contact_email', 'varchar(255)');
    await addColumnIfNotExists('contact_phone', 'varchar(50)');
    await addColumnIfNotExists('website', 'varchar(500)');

    // Address columns
    await addColumnIfNotExists('address_line1', 'varchar(255)');
    await addColumnIfNotExists('address_line2', 'varchar(255)');
    await addColumnIfNotExists('city', 'varchar(100)');
    await addColumnIfNotExists('state', 'varchar(100)');
    await addColumnIfNotExists('postal_code', 'varchar(20)');
    await addColumnIfNotExists('country', 'varchar(100)');

    // Business Information columns
    await addColumnIfNotExists('business_name', 'varchar(255)');
    await addColumnIfNotExists('business_type', 'business_type_enum');
    await addColumnIfNotExists('tax_id', 'varchar(100)');
    await addColumnIfNotExists('registration_number', 'varchar(100)');

    // Branding columns
    await addColumnIfNotExists('logo_url', 'varchar(500)');
    await addColumnIfNotExists('primary_color', 'varchar(10)');
    await addColumnIfNotExists('secondary_color', 'varchar(10)');

    // Settings columns
    await addColumnIfNotExists('timezone', 'varchar(50)', "'UTC'");
    await addColumnIfNotExists('currency', 'varchar(3)', "'USD'");
    await addColumnIfNotExists('locale', 'varchar(10)', "'en-US'");
    await addColumnIfNotExists('date_format', 'varchar(20)', "'YYYY-MM-DD'");

    // Subscription columns
    await addColumnIfNotExists('plan', 'tenant_plan_enum', "'free'");
    await addColumnIfNotExists('max_channels', 'int', '3');
    await addColumnIfNotExists('max_products', 'int', '100');
    await addColumnIfNotExists('max_warehouses', 'int', '1');

    // Timestamp column
    await addColumnIfNotExists('updated_at', 'timestamp', 'CURRENT_TIMESTAMP');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Helper to drop column if exists
    const dropColumnIfExists = async (column: string) => {
      const hasColumn = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'tenants' 
          AND column_name = '${column}'
        );
      `);

      if (hasColumn[0].exists) {
        await queryRunner.query(
          `ALTER TABLE "tenants" DROP COLUMN "${column}"`,
        );
      }
    };

    // Remove columns in reverse order
    await dropColumnIfExists('updated_at');
    await dropColumnIfExists('max_warehouses');
    await dropColumnIfExists('max_products');
    await dropColumnIfExists('max_channels');
    await dropColumnIfExists('plan');
    await dropColumnIfExists('date_format');
    await dropColumnIfExists('locale');
    await dropColumnIfExists('currency');
    await dropColumnIfExists('timezone');
    await dropColumnIfExists('secondary_color');
    await dropColumnIfExists('primary_color');
    await dropColumnIfExists('logo_url');
    await dropColumnIfExists('registration_number');
    await dropColumnIfExists('tax_id');
    await dropColumnIfExists('business_type');
    await dropColumnIfExists('business_name');
    await dropColumnIfExists('country');
    await dropColumnIfExists('postal_code');
    await dropColumnIfExists('state');
    await dropColumnIfExists('city');
    await dropColumnIfExists('address_line2');
    await dropColumnIfExists('address_line1');
    await dropColumnIfExists('website');
    await dropColumnIfExists('contact_phone');
    await dropColumnIfExists('contact_email');

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS tenant_plan_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS business_type_enum`);
  }
}
