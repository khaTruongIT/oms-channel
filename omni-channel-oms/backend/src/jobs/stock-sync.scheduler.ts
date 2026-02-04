import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import type { BatchStockSyncJob } from './dto/job-data.interface';

@Injectable()
export class StockSyncScheduler {
  private readonly logger = new Logger(StockSyncScheduler.name);

  constructor(
    @InjectQueue('batch-sync') private batchSyncQueue: Queue,
    private readonly dataSource: DataSource,
  ) {}

  // Run batch sync every 30 minutes
  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduleBatchSync() {
    this.logger.log('Starting scheduled batch stock sync for all tenants');

    try {
      // Get all active tenants
      const tenants = await this.dataSource.query(
        `SELECT id, schema_name FROM public.tenants WHERE is_active = TRUE`,
      );

      this.logger.log(`Found ${tenants.length} active tenants for batch sync`);

      for (const tenant of tenants) {
        const jobData: BatchStockSyncJob = {
          schemaName: tenant.schema_name,
          tenantId: tenant.id,
        };

        await this.batchSyncQueue.add('sync-all-products', jobData, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: false,
          removeOnFail: false,
        });

        this.logger.log(`Queued batch sync job for tenant ${tenant.id}`);
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to schedule batch sync: ${error.message}`,
        error.stack,
      );
    }
  }

  // Manual trigger for batch sync
  async triggerBatchSync(schemaName: string, tenantId: string): Promise<any> {
    this.logger.log(`Manually triggering batch sync for tenant ${tenantId}`);

    const jobData: BatchStockSyncJob = {
      schemaName,
      tenantId,
    };

    const job = await this.batchSyncQueue.add('sync-all-products', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    return {
      jobId: job.id,
      status: 'queued',
    };
  }
}
