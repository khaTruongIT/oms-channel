import { DataSource } from 'typeorm';
import { backfillCustomersForSchema, runBackfill } from './backfill-customers';

describe('backfillCustomers (S4.3.7)', () => {
  let mockDataSource: { query: jest.Mock };

  beforeEach(() => {
    mockDataSource = {
      query: jest.fn(),
    };
  });

  it('backfills orders and links them to customers idempotently', async () => {
    // 1st query: get orders batch 1
    mockDataSource.query
      .mockResolvedValueOnce([
        {
          id: 'ord-1',
          customer_name: 'Nguyễn Văn A',
          customer_phone: '0901234567',
          total_amount: 150000,
          created_at: new Date('2026-01-01'),
        },
      ])
      // 2nd query: upsert customer
      .mockResolvedValueOnce([{ id: 'cust-1' }])
      // 3rd query: update order
      .mockResolvedValueOnce([])
      // 4th query: get orders batch 2 (empty -> exit loop)
      .mockResolvedValueOnce([])
      // 5th query: recalculate totals
      .mockResolvedValueOnce([]);

    const summary = await backfillCustomersForSchema(
      mockDataSource as unknown as DataSource,
      'tenant_test',
      10,
    );

    expect(summary.processedOrders).toBe(1);
    expect(summary.linkedOrders).toBe(1);
    expect(summary.upsertedCustomers).toBe(1);

    // Verify phone was normalized to canonical 0901234567
    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "tenant_test".customers'),
      expect.arrayContaining(['Nguyễn Văn A', '0901234567']),
    );

    // Verify recalculate totals was called
    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE "tenant_test".customers c'),
    );
  });

  it('runs backfill across all tenants when no specific schema is provided', async () => {
    mockDataSource.query
      // query tenants
      .mockResolvedValueOnce([
        { schema_name: 'tenant_1' },
        { schema_name: 'tenant_2' },
      ])
      // tenant_1 orders
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      // tenant_2 orders
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const summaries = await runBackfill(
      mockDataSource as unknown as DataSource,
    );

    expect(summaries).toHaveLength(2);
    expect(summaries[0].schema).toBe('tenant_1');
    expect(summaries[1].schema).toBe('tenant_2');
  });
});
