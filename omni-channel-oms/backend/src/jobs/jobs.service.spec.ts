import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Queue } from 'bull';
import { JobsService } from './jobs.service';

const tenantA = 'tenant-a';
const tenantB = 'tenant-b';

function buildService(job: object | null): {
  service: JobsService;
  batchSyncQueue: Pick<Queue, 'getJob'>;
} {
  const stockSyncQueue = {
    getJob: jest.fn(),
  } as unknown as Queue;
  const batchSyncQueue = {
    getJob: jest.fn().mockResolvedValue(job),
  } as unknown as Pick<Queue, 'getJob'>;

  return {
    service: new JobsService(stockSyncQueue, batchSyncQueue as Queue),
    batchSyncQueue,
  };
}

function createJob(tenantId: string) {
  return {
    id: 'job-1',
    data: { tenantId },
    getState: jest.fn().mockResolvedValue('completed'),
    progress: jest.fn().mockReturnValue(100),
    returnvalue: { synced: 3 },
    failedReason: undefined,
    attemptsMade: 1,
  };
}

describe('JobsService.getJobStatus', () => {
  it('adds the tenant ID to stock-sync jobs', async () => {
    const add = jest.fn().mockResolvedValue({ id: 'stock-job-1' });
    const stockSyncQueue = {
      add,
    } as unknown as Queue;
    const service = new JobsService(stockSyncQueue, {} as Queue);

    await expect(
      service.queueStockSync('sku-1', 'warehouse-1', 4, 'tenant_one', tenantA),
    ).resolves.toEqual({ jobId: 'stock-job-1', status: 'queued' });
    expect(add).toHaveBeenCalledWith(
      'sync-product-stock',
      expect.objectContaining({ tenantId: tenantA }),
      expect.any(Object),
    );
  });

  it('rejects queue names outside the allowlist', async () => {
    const { service } = buildService(null);

    await expect(
      service.getJobStatus('arbitrary-queue', 'job-1', tenantA),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not expose a job owned by another tenant', async () => {
    const { service } = buildService(createJob(tenantB));

    await expect(
      service.getJobStatus('batch-sync', 'job-1', tenantA),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns not found when the requested job does not exist', async () => {
    const { service } = buildService(null);

    await expect(
      service.getJobStatus('batch-sync', 'job-1', tenantA),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the state for a job owned by the requesting tenant', async () => {
    const { service } = buildService(createJob(tenantA));

    await expect(
      service.getJobStatus('batch-sync', 'job-1', tenantA),
    ).resolves.toMatchObject({
      jobId: 'job-1',
      state: 'completed',
      result: { synced: 3 },
    });
  });

  it('returns a stock-sync job when it belongs to the requesting tenant', async () => {
    const stockSyncQueue = {
      getJob: jest.fn().mockResolvedValue(createJob(tenantA)),
    } as unknown as Queue;
    const service = new JobsService(stockSyncQueue, {} as Queue);

    await expect(
      service.getJobStatus('stock-sync', 'job-1', tenantA),
    ).resolves.toMatchObject({ jobId: 'job-1', state: 'completed' });
  });
});
