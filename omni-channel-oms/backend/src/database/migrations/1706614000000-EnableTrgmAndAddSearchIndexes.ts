import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableTrgmAndAddSearchIndexes1706614000000
  implements MigrationInterface
{
  name = 'EnableTrgmAndAddSearchIndexes1706614000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enable pg_trgm extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);

    // 2. Query all existing tenant schemas
    const tenants = (await queryRunner.query(
      `SELECT schema_name FROM public.tenants WHERE schema_name IS NOT NULL`,
    )) as Array<{ schema_name: string }>;

    const schemas = new Set<string>();
    for (const t of tenants) {
      if (t.schema_name) {
        schemas.add(t.schema_name);
      }
    }

    // 3. Create trigram gin indexes for fast ILIKE and similarity searches
    for (const schema of schemas) {
      // master_skus
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_master_skus_sku_code_trgm
        ON "${schema}".master_skus USING gin (sku_code gin_trgm_ops);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_master_skus_name_trgm
        ON "${schema}".master_skus USING gin (product_name gin_trgm_ops);
      `);

      // orders
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_order_number_trgm
        ON "${schema}".orders USING gin (order_number gin_trgm_ops);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_customer_name_trgm
        ON "${schema}".orders USING gin (customer_name gin_trgm_ops);
      `);

      // customers
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_customers_full_name_trgm
        ON "${schema}".customers USING gin (full_name gin_trgm_ops);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm
        ON "${schema}".customers USING gin (phone gin_trgm_ops);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tenants = (await queryRunner.query(
      `SELECT schema_name FROM public.tenants WHERE schema_name IS NOT NULL`,
    )) as Array<{ schema_name: string }>;

    for (const t of tenants) {
      if (t.schema_name) {
        await queryRunner.query(`
          DROP INDEX IF EXISTS "${t.schema_name}".idx_customers_phone_trgm;
          DROP INDEX IF EXISTS "${t.schema_name}".idx_customers_full_name_trgm;
          DROP INDEX IF EXISTS "${t.schema_name}".idx_orders_customer_name_trgm;
          DROP INDEX IF EXISTS "${t.schema_name}".idx_orders_order_number_trgm;
          DROP INDEX IF EXISTS "${t.schema_name}".idx_master_skus_name_trgm;
          DROP INDEX IF EXISTS "${t.schema_name}".idx_master_skus_sku_code_trgm;
        `);
      }
    }
  }
}
