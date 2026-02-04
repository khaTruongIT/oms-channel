import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { StockSyncJob } from './dto/job-data.interface';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('stock-sync') private stockSyncQueue: Queue,
    @InjectQueue('batch-sync') private batchSyncQueue: Queue,
  ) {}

  async queueStockSync(
    masterSkuId: string,
    warehouseId: string,
    quantity: number,
    schemaName: string,
  ): Promise<any> {
    const jobData: StockSyncJob = {
      masterSkuId,
      warehouseId,
      quantity,
      schemaName,
    };

    const job = await this.stockSyncQueue.add('sync-product-stock', jobData, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    });

    return {
      jobId: job.id,
      status: 'queued',
    };
  }

  async getJobStatus(queueName: string, jobId: string): Promise<any> {
    const queue =
      queueName === 'stock-sync' ? this.stockSyncQueue : this.batchSyncQueue;
    const job = await queue.getJob(jobId);

    if (!job) {
      return { status: 'not_found' };
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;

    return {
      jobId: job.id,
      state,
      progress,
      result,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
    };
  }
}
