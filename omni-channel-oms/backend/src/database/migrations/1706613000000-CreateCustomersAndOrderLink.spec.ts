import { QueryRunner } from 'typeorm';
import { CreateCustomersAndOrderLink1706613000000 } from './1706613000000-CreateCustomersAndOrderLink';

describe('CreateCustomersAndOrderLink1706613000000 Migration', () => {
  let migration: CreateCustomersAndOrderLink1706613000000;
  let queryRunner: jest.Mocked<QueryRunner>;

  beforeEach(() => {
    migration = new CreateCustomersAndOrderLink1706613000000();
    queryRunner = {
      query: jest.fn().mockImplementation((sql: string) => {
        if (sql.includes('SELECT schema_name FROM public.tenants')) {
          return Promise.resolve([{ schema_name: 'tenant_alpha' }]);
        }
        if (sql.includes('SELECT id, customer_name, customer_phone')) {
          return Promise.resolve([
            {
              id: 'order-1',
              customer_name: 'Nguyễn Văn A',
              customer_phone: '+84901234567',
              total_amount: '150000',
              created_at: new Date('2026-10-01'),
            },
          ]);
        }
        if (sql.includes('INSERT INTO "tenant_alpha".customers')) {
          return Promise.resolve([{ id: 'cust-uuid-1' }]);
        }
        return Promise.resolve([]);
      }),
    } as any;
  });

  it('should create customers table, add customer_id to orders, and backfill customer from order', async () => {
    await migration.up(queryRunner);

    // Table creation
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "tenant_alpha".customers'),
    );

    // Column addition
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE "tenant_alpha".orders\n        ADD COLUMN IF NOT EXISTS customer_id'),
    );

    // Customer backfill upsert with normalized phone
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "tenant_alpha".customers'),
      expect.arrayContaining(['Nguyễn Văn A', '0901234567']),
    );

    // Link customer_id to order
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE "tenant_alpha".orders SET customer_id = $1 WHERE id = $2'),
      ['cust-uuid-1', 'order-1'],
    );
  });

  it('should revert migration on down', async () => {
    await migration.down(queryRunner);

    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE "tenant_alpha".orders DROP COLUMN IF EXISTS customer_id'),
    );
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('DROP TABLE IF EXISTS "tenant_alpha".customers CASCADE'),
    );
  });
});
