import { MigrationInterface, QueryRunner } from 'typeorm';

interface TenantSchemaRow {
  table_schema: string;
}

function isTenantSchemaRow(value: unknown): value is TenantSchemaRow {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TenantSchemaRow).table_schema === 'string'
  );
}

export class AddProductPublicMetadata1706607000000
  implements MigrationInterface
{
  name = 'AddProductPublicMetadata1706607000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(`
      SELECT table_schema
      FROM information_schema.tables
      WHERE table_name = 'master_skus'
        AND table_schema LIKE 'tenant_%'
    `);
    const schemas = Array.isArray(rows) ? rows.filter(isTenantSchemaRow) : [];

    for (const row of schemas) {
      await queryRunner.query(
        `ALTER TABLE "${row.table_schema}".master_skus
         ADD COLUMN IF NOT EXISTS public_metadata JSONB`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(`
      SELECT table_schema
      FROM information_schema.tables
      WHERE table_name = 'master_skus'
        AND table_schema LIKE 'tenant_%'
    `);
    const schemas = Array.isArray(rows) ? rows.filter(isTenantSchemaRow) : [];

    for (const row of schemas) {
      await queryRunner.query(
        `ALTER TABLE "${row.table_schema}".master_skus
         DROP COLUMN IF EXISTS public_metadata`,
      );
    }
  }
}
