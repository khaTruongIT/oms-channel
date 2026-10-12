import { QueryRunner } from 'typeorm';
import { EnableTrgmAndAddSearchIndexes1706614000000 } from './1706614000000-EnableTrgmAndAddSearchIndexes';

describe('EnableTrgmAndAddSearchIndexes1706614000000 (S5.1.1)', () => {
  let migration: EnableTrgmAndAddSearchIndexes1706614000000;
  let mockQueryRunner: { query: jest.Mock };

  beforeEach(() => {
    migration = new EnableTrgmAndAddSearchIndexes1706614000000();
    mockQueryRunner = {
      query: jest.fn(),
    };
  });

  it('enables pg_trgm extension and creates trigram indexes across all tenant schemas', async () => {
    mockQueryRunner.query
      // 1. CREATE EXTENSION pg_trgm
      .mockResolvedValueOnce([])
      // 2. SELECT schema_name FROM public.tenants
      .mockResolvedValueOnce([{ schema_name: 'tenant_alpha' }])
      // 3. CREATE INDEX queries
      .mockResolvedValue([]);

    await migration.up(mockQueryRunner as unknown as QueryRunner);

    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE EXTENSION IF NOT EXISTS "pg_trgm"'),
    );

    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('idx_master_skus_sku_code_trgm'),
    );
    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('idx_master_skus_name_trgm'),
    );
    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('idx_orders_order_number_trgm'),
    );
    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('idx_orders_customer_name_trgm'),
    );
    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('idx_customers_full_name_trgm'),
    );
    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('idx_customers_phone_trgm'),
    );
  });

  it('drops indexes on down migration', async () => {
    mockQueryRunner.query
      .mockResolvedValueOnce([{ schema_name: 'tenant_alpha' }])
      .mockResolvedValue([]);

    await migration.down(mockQueryRunner as unknown as QueryRunner);

    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('DROP INDEX IF EXISTS "tenant_alpha".idx_master_skus_sku_code_trgm'),
    );
  });
});
