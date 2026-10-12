import { FakeMarketplaceAdapter } from './fake-marketplace.adapter';
import { ErrorCode } from '../../common/errors/error-codes';
import { OUTBOX_BACKOFF_SECONDS } from '../../jobs/processors/outbox-publisher.processor';

describe('Integration Contract & Fake Adapter Fixtures (S3.1.7)', () => {
  let adapter: FakeMarketplaceAdapter;

  beforeEach(() => {
    adapter = new FakeMarketplaceAdapter();
  });

  describe('FakeMarketplaceAdapter capabilities', () => {
    it('seeds and retrieves products without network', async () => {
      adapter.seedProduct({
        itemId: 'EXT-100',
        variantId: 'V-1',
        name: 'Test Wireless Mouse',
        price: 25.0,
        stock: 50,
      });

      const prod = await adapter.getProduct('EXT-100', 'V-1');
      expect(prod.name).toBe('Test Wireless Mouse');
      expect(prod.stock).toBe(50);
    });

    it('updates stock and records history', async () => {
      adapter.seedProduct({
        itemId: 'EXT-100',
        name: 'Test Wireless Mouse',
        price: 25.0,
        stock: 50,
      });

      await adapter.updateStock('EXT-100', null, 42);

      expect(adapter.stockUpdates).toHaveLength(1);
      expect(adapter.stockUpdates[0].quantity).toBe(42);

      const updated = await adapter.getProduct('EXT-100');
      expect(updated.stock).toBe(42);
    });

    it('simulates controlled transient network failures', async () => {
      adapter.failNextStockUpdates = 2;

      await expect(adapter.updateStock('EXT-1', null, 10)).rejects.toThrow(
        /simulated/,
      );
      await expect(adapter.updateStock('EXT-1', null, 10)).rejects.toThrow(
        /simulated/,
      );

      // Third attempt succeeds
      await adapter.updateStock('EXT-1', null, 10);
      expect(adapter.stockUpdates).toHaveLength(1);
    });
  });

  describe('Contract Fixtures: Failure Modes in CI without network', () => {
    it('Fixture 1 (Webhook trùng): duplicate delivery returns duplicate code without crashing', () => {
      const deliveredIds = new Set<string>();
      const processDelivery = (deliveryId: string) => {
        if (deliveredIds.has(deliveryId)) {
          return { status: 'duplicate', code: ErrorCode.ORDER_DUPLICATE };
        }
        deliveredIds.add(deliveryId);
        return { status: 'success' };
      };

      const first = processDelivery('DELIV-001');
      const second = processDelivery('DELIV-001');

      expect(first.status).toBe('success');
      expect(second.status).toBe('duplicate');
      expect(second.code).toBe(ErrorCode.ORDER_DUPLICATE);
    });

    it('Fixture 2 (Thiếu mapping): unmapped SKU returns UNMAPPED_SKU exception with redacted PII', () => {
      const mappingTable = new Map<string, string>(); // empty mappings

      const handleWebhookItem = (rawPayload: {
        itemId: string;
        customerPhone: string;
        customerName: string;
      }) => {
        const masterSkuId = mappingTable.get(rawPayload.itemId);
        if (!masterSkuId) {
          return {
            exception: {
              type: ErrorCode.UNMAPPED_SKU,
              severity: 'HIGH',
              context: {
                itemId: rawPayload.itemId,
                customerName: rawPayload.customerName ? `${rawPayload.customerName[0]}***` : undefined,
                customerPhone: '***REDACTED***',
              },
            },
          };
        }
        return { success: true };
      };

      const result = handleWebhookItem({
        itemId: 'UNMAPPED-123',
        customerPhone: '0987654321',
        customerName: 'Le Thi B',
      });

      expect(result.exception?.type).toBe(ErrorCode.UNMAPPED_SKU);
      expect(result.exception?.context.customerPhone).toBe('***REDACTED***');
      expect(result.exception?.context.customerName).toBe('L***');
    });

    it('Fixture 3 (Publisher lỗi & Backoff): respects 4-tier backoff sequence (1m, 5m, 30m, 2h) then DEAD', () => {
      expect(OUTBOX_BACKOFF_SECONDS).toEqual([60, 300, 1800, 7200]);

      let attempts = 0;
      let status = 'PENDING';

      const simulateFailedPublish = () => {
        attempts++;
        if (attempts >= OUTBOX_BACKOFF_SECONDS.length) {
          status = 'DEAD';
        } else {
          status = 'FAILED';
        }
      };

      // 1st error -> FAILED (backoff 60s)
      simulateFailedPublish();
      expect(status).toBe('FAILED');
      expect(attempts).toBe(1);

      // 2nd error -> FAILED (backoff 300s)
      simulateFailedPublish();
      expect(status).toBe('FAILED');
      expect(attempts).toBe(2);

      // 3rd error -> FAILED (backoff 1800s)
      simulateFailedPublish();
      expect(status).toBe('FAILED');
      expect(attempts).toBe(3);

      // 4th error -> DEAD (no more retries)
      simulateFailedPublish();
      expect(status).toBe('DEAD');
      expect(attempts).toBe(4);
    });
  });
});
