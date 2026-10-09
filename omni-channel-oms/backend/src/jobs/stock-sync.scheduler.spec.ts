import type { Queue } from 'bull';
import type { DataSource } from 'typeorm';
import { StockSyncScheduler } from './stock-sync.scheduler';

describe('StockSyncScheduler', () => {
  it('preserves tenant ownership when manually queuing a batch sync', async () => {
    const add = jest.fn().mockResolvedValue({ id: 'batch-job-1' });
    const scheduler = new StockSyncScheduler(
      { add } as unknown as Queue,
      {} as DataSource,
    );

    await expect(
      scheduler.triggerBatchSync('tenant_one', 'tenant-1'),
    ).resolves.toEqual({ jobId: 'batch-job-1', status: 'queued' });
    expect(add).toHaveBeenCalledWith(
      'sync-all-products',
      { schemaName: 'tenant_one', tenantId: 'tenant-1' },
      expect.any(Object),
    );
  });
});
