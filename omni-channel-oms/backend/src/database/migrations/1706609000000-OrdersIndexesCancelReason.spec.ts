import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('OrdersIndexesCancelReason migration', () => {
  const source = readFileSync(
    join(__dirname, '1706609000000-OrdersIndexesCancelReason.ts'),
    'utf8',
  );

  it('adds cancel_reason column to tenant orders table', () => {
    expect(source).toContain('cancel_reason TEXT');
    expect(source).toContain('ALTER TABLE ${schema}.orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT');
  });

  it('creates composite and single-column performance indexes on orders', () => {
    expect(source).toContain('idx_orders_status_created_at');
    expect(source).toContain('idx_orders_external_order_id');
    expect(source).toContain('idx_orders_channel_account_id');
    expect(source).toContain('(status, created_at DESC)');
    expect(source).toContain('(external_order_id)');
    expect(source).toContain('(channel_account_id)');
  });

  it('provides a clean down rollback path', () => {
    expect(source).toContain('DROP INDEX IF EXISTS ${schema}.idx_orders_status_created_at');
    expect(source).toContain('DROP INDEX IF EXISTS ${schema}.idx_orders_external_order_id');
    expect(source).toContain('DROP INDEX IF EXISTS ${schema}.idx_orders_channel_account_id');
    expect(source).toContain('ALTER TABLE ${schema}.orders DROP COLUMN IF EXISTS cancel_reason');
  });
});
