import { MigrationInterface, QueryRunner } from 'typeorm';

interface InventorySchemaRow {
  table_schema: string;
}

const INVENTORY_SCHEMA_QUERY = `
  SELECT table_schema
  FROM information_schema.tables
  WHERE table_name = 'inventory'
    AND table_type = 'BASE TABLE'
    AND table_schema NOT IN ('pg_catalog', 'information_schema')
  ORDER BY table_schema
`;

const ADD_INVENTORY_CHECK_CONSTRAINTS_SQL = `
DO $$
DECLARE
  schema_record RECORD;
BEGIN
  FOR schema_record IN
    ${INVENTORY_SCHEMA_QUERY}
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint constraint_record
      JOIN pg_class table_record
        ON table_record.oid = constraint_record.conrelid
      JOIN pg_namespace namespace_record
        ON namespace_record.oid = table_record.relnamespace
      WHERE constraint_record.conname = 'chk_inventory_quantity_non_negative'
        AND table_record.relname = 'inventory'
        AND namespace_record.nspname = schema_record.table_schema
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.inventory ADD CONSTRAINT chk_inventory_quantity_non_negative CHECK (quantity >= 0)',
        schema_record.table_schema
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint constraint_record
      JOIN pg_class table_record
        ON table_record.oid = constraint_record.conrelid
      JOIN pg_namespace namespace_record
        ON namespace_record.oid = table_record.relnamespace
      WHERE constraint_record.conname = 'chk_inventory_reserved_non_negative'
        AND table_record.relname = 'inventory'
        AND namespace_record.nspname = schema_record.table_schema
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.inventory ADD CONSTRAINT chk_inventory_reserved_non_negative CHECK (reserved_quantity >= 0)',
        schema_record.table_schema
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint constraint_record
      JOIN pg_class table_record
        ON table_record.oid = constraint_record.conrelid
      JOIN pg_namespace namespace_record
        ON namespace_record.oid = table_record.relnamespace
      WHERE constraint_record.conname = 'chk_inventory_safety_stock_non_negative'
        AND table_record.relname = 'inventory'
        AND namespace_record.nspname = schema_record.table_schema
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.inventory ADD CONSTRAINT chk_inventory_safety_stock_non_negative CHECK (safety_stock >= 0)',
        schema_record.table_schema
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint constraint_record
      JOIN pg_class table_record
        ON table_record.oid = constraint_record.conrelid
      JOIN pg_namespace namespace_record
        ON namespace_record.oid = table_record.relnamespace
      WHERE constraint_record.conname = 'chk_inventory_reserved_lte_quantity'
        AND table_record.relname = 'inventory'
        AND namespace_record.nspname = schema_record.table_schema
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.inventory ADD CONSTRAINT chk_inventory_reserved_lte_quantity CHECK (reserved_quantity <= quantity)',
        schema_record.table_schema
      );
    END IF;
  END LOOP;
END $$;
`;

const DROP_INVENTORY_CHECK_CONSTRAINTS_SQL = `
DO $$
DECLARE
  schema_record RECORD;
BEGIN
  FOR schema_record IN
    ${INVENTORY_SCHEMA_QUERY}
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.inventory DROP CONSTRAINT IF EXISTS chk_inventory_reserved_lte_quantity',
      schema_record.table_schema
    );
    EXECUTE format(
      'ALTER TABLE %I.inventory DROP CONSTRAINT IF EXISTS chk_inventory_safety_stock_non_negative',
      schema_record.table_schema
    );
    EXECUTE format(
      'ALTER TABLE %I.inventory DROP CONSTRAINT IF EXISTS chk_inventory_reserved_non_negative',
      schema_record.table_schema
    );
    EXECUTE format(
      'ALTER TABLE %I.inventory DROP CONSTRAINT IF EXISTS chk_inventory_quantity_non_negative',
      schema_record.table_schema
    );
  END LOOP;
END $$;
`;

function isInventorySchemaRow(value: unknown): value is InventorySchemaRow {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const maybeRow = value as Record<string, unknown>;
  return typeof maybeRow.table_schema === 'string';
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function getInventorySchemas(
  queryRunner: QueryRunner,
): Promise<InventorySchemaRow[]> {
  const rows = (await queryRunner.query(INVENTORY_SCHEMA_QUERY)) as unknown;
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.filter(isInventorySchemaRow);
}

export class AddInventoryIntegrityConstraints1706606000000 implements MigrationInterface {
  public readonly name = 'AddInventoryIntegrityConstraints1706606000000';

  public readonly transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(ADD_INVENTORY_CHECK_CONSTRAINTS_SQL);

    const schemas = await getInventorySchemas(queryRunner);
    for (const { table_schema: schemaName } of schemas) {
      const quotedSchema = quoteIdentifier(schemaName);
      await queryRunner.query(
        `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_inventory_sku_warehouse_unique" ON ${quotedSchema}.inventory(master_sku_id, warehouse_id)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schemas = await getInventorySchemas(queryRunner);
    for (const { table_schema: schemaName } of schemas) {
      const quotedSchema = quoteIdentifier(schemaName);
      await queryRunner.query(
        `DROP INDEX CONCURRENTLY IF EXISTS ${quotedSchema}."idx_inventory_sku_warehouse_unique"`,
      );
    }

    await queryRunner.query(DROP_INVENTORY_CHECK_CONSTRAINTS_SQL);
  }
}
