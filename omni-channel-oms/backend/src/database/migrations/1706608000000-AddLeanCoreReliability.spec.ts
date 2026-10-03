import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('AddLeanCoreReliability migration', () => {
  const source = readFileSync(
    join(__dirname, '1706608000000-AddLeanCoreReliability.ts'),
    'utf8',
  );

  it('creates account, inbox, outbox, exception, reconciliation, and ledger storage', () => {
    expect(source).toContain('public.channel_accounts');
    expect(source).toContain('inventory_movements');
    expect(source).toContain('webhook_inbox');
    expect(source).toContain('outbox_events');
    expect(source).toContain('integration_exceptions');
    expect(source).toContain('reconciliation_runs');
  });

  it('protects external-order and webhook delivery idempotency at the database layer', () => {
    expect(source).toContain('idx_orders_account_external_order_unique');
    expect(source).toContain('idx_orders_legacy_channel_external_order_unique');
    expect(source).toContain('uq_webhook_inbox_delivery');
    expect(source).toContain('uq_inventory_movements_idempotency');
  });
});
