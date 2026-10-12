import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_SCHEMAS_QUERY = `
  SELECT schema_name
  FROM public.tenants
  ORDER BY schema_name
`;

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

export class OrdersIndexesCancelReason1706609000000
  implements MigrationInterface
{
  public readonly name = 'OrdersIndexesCancelReason1706609000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schemas = (await queryRunner.query(TENANT_SCHEMAS_QUERY)) as Array<{
      schema_name: string;
    }>;

    for (const { schema_name: schemaName } of schemas) {
      const schema = quoteIdentifier(schemaName);

      await queryRunner.query(
        `ALTER TABLE ${schema}.orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT`,
      );

      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON ${schema}.orders (status, created_at DESC)`,
      );

      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_orders_external_order_id ON ${schema}.orders (external_order_id)`,
      );

      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_orders_channel_account_id ON ${schema}.orders (channel_account_id)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schemas = (await queryRunner.query(TENANT_SCHEMAS_QUERY)) as Array<{
      schema_name: string;
    }>;

    for (const { schema_name: schemaName } of schemas) {
      const schema = quoteIdentifier(schemaName);

      await queryRunner.query(
        `DROP INDEX IF EXISTS ${schema}.idx_orders_status_created_at`,
      );

      await queryRunner.query(
        `DROP INDEX IF EXISTS ${schema}.idx_orders_external_order_id`,
      );

      await queryRunner.query(
        `DROP INDEX IF EXISTS ${schema}.idx_orders_channel_account_id`,
      );

      await queryRunner.query(
        `ALTER TABLE ${schema}.orders DROP COLUMN IF EXISTS cancel_reason`,
      );
    }
  }
}
