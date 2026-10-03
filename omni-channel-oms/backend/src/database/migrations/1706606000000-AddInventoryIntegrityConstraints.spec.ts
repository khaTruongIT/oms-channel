import { QueryRunner } from 'typeorm';
import { AddInventoryIntegrityConstraints1706606000000 } from './1706606000000-AddInventoryIntegrityConstraints';

type QueryRunnerMock = Pick<QueryRunner, 'query'>;

function createQueryRunnerMock(): jest.Mocked<QueryRunnerMock> {
  return {
    query: jest.fn().mockResolvedValue([{ table_schema: 'tenant_schema' }]),
  };
}

describe('AddInventoryIntegrityConstraints1706606000000', () => {
  it('adds inventory quantity and uniqueness safeguards to tenant schemas', async () => {
    const queryRunner = createQueryRunnerMock();
    const migration = new AddInventoryIntegrityConstraints1706606000000();

    await migration.up(queryRunner as QueryRunner);

    const migrationSql = queryRunner.query.mock.calls[0]?.[0];
    const uniqueIndexSql = queryRunner.query.mock.calls[2]?.[0];

    expect(migrationSql).toContain('chk_inventory_quantity_non_negative');
    expect(migrationSql).toContain('quantity >= 0');
    expect(migrationSql).toContain('chk_inventory_reserved_non_negative');
    expect(migrationSql).toContain('reserved_quantity >= 0');
    expect(migrationSql).toContain('chk_inventory_reserved_lte_quantity');
    expect(migrationSql).toContain('reserved_quantity <= quantity');
    expect(uniqueIndexSql).toContain(
      'CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_inventory_sku_warehouse_unique"',
    );
    expect(uniqueIndexSql).toContain(
      '"tenant_schema".inventory(master_sku_id, warehouse_id)',
    );
  });

  it('drops inventory safeguards during down migration', async () => {
    const queryRunner = createQueryRunnerMock();
    const migration = new AddInventoryIntegrityConstraints1706606000000();

    await migration.down(queryRunner as QueryRunner);

    const dropIndexSql = queryRunner.query.mock.calls[1]?.[0];
    const migrationSql = queryRunner.query.mock.calls[2]?.[0];

    expect(dropIndexSql).toContain(
      'DROP INDEX CONCURRENTLY IF EXISTS "tenant_schema"."idx_inventory_sku_warehouse_unique"',
    );
    expect(migrationSql).toContain('DROP CONSTRAINT IF EXISTS');
    expect(migrationSql).toContain('chk_inventory_reserved_lte_quantity');
  });
});
