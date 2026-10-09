import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { QueuedJobResponse, StockSyncJob } from './dto/job-data.interface';

export type SupportedJobQueue = 'stock-sync' | 'batch-sync';

interface TenantOwnedJobData {
  tenantId?: unknown;
}

export interface JobStatusResponse {
  jobId: string | number | undefined;
  state: string;
  progress: unknown;
  result: unknown;
  failedReason: string | undefined;
  attemptsMade: number;
}

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
    tenantId: string,
  ): Promise<QueuedJobResponse> {
    const jobData: StockSyncJob = {
      masterSkuId,
      warehouseId,
      quantity,
      schemaName,
      tenantId,
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

  async getJobStatus(
    queueName: string,
    jobId: string,
    tenantId: string,
  ): Promise<JobStatusResponse> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);

    const jobData = job?.data as TenantOwnedJobData | undefined;

    if (!job || !jobData || !this.isOwnedByTenant(jobData, tenantId)) {
      throw new NotFoundException('Job not found');
    }

    const state = await job.getState();
    const progress = job.progress() as unknown;
    const result = job.returnvalue as unknown;

    return {
      jobId: job.id,
      state,
      progress,
      result,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
    };
  }

  private getQueue(queueName: string): Queue {
    if (queueName === 'stock-sync') {
      return this.stockSyncQueue;
    }

    if (queueName === 'batch-sync') {
      return this.batchSyncQueue;
    }

    throw new BadRequestException('Unsupported job queue');
  }

  private isOwnedByTenant(
    jobData: TenantOwnedJobData,
    tenantId: string,
  ): boolean {
    return jobData.tenantId === tenantId;
  }
}
