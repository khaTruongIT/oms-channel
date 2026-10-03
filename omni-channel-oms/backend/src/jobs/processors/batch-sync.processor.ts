import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { DataSource } from 'typeorm';
import { BatchStockSyncJob } from '../dto/job-data.interface';
import { ChannelMappingsService } from '../../channel-mappings/channel-mappings.service';

interface InventoryForSyncRow {
  master_sku_id: string;
  warehouse_id: string;
  available_quantity: string | number;
}

interface BatchSyncDetail {
  masterSkuId: string;
  channel: string;
  itemId: string;
  quantity?: number;
  error?: string;
  status: 'success' | 'failed';
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unknown synchronization error';
}

@Processor('batch-sync')
export class BatchSyncProcessor {
  private readonly logger = new Logger(BatchSyncProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly channelMappingsService: ChannelMappingsService,
  ) {}

  @Process('sync-all-products')
  async handleBatchSync(job: Job<BatchStockSyncJob>) {
    const { schemaName, tenantId } = job.data;

    this.logger.log(
      `Processing batch sync job ${job.id} for tenant ${tenantId}`,
    );

    try {
      // Get all inventory items
      const inventory = await this.dataSource.query<InventoryForSyncRow[]>(
        `SELECT i.master_sku_id,
                i.warehouse_id,
                GREATEST(0, i.quantity - i.reserved_quantity - i.safety_stock) AS available_quantity
         FROM "${schemaName}".inventory i
         JOIN "${schemaName}".master_skus ms ON ms.id = i.master_sku_id
         WHERE ms.deleted_at IS NULL`,
      );

      this.logger.log(`Found ${inventory.length} inventory items to sync`);

      const results = {
        total: inventory.length,
        synced: 0,
        skipped: 0,
        failed: 0,
        details: [] as BatchSyncDetail[],
      };

      for (const item of inventory) {
        const { master_sku_id } = item;

        try {
          // Get channel mappings
          const mappings =
            await this.channelMappingsService.getMappingsByMasterSku(
              master_sku_id,
              schemaName,
            );

          if (mappings.length === 0) {
            results.skipped++;
            continue;
          }

          // Sync to each channel
          for (const mapping of mappings) {
            try {
              if (!mapping.channelAccountId) {
                results.skipped++;
                continue;
              }

              const account = await this.dataSource.query<
                Array<{ status: string }>
              >(
                `SELECT channel_accounts.status
                 FROM public.channel_accounts
                 JOIN public.tenants ON tenants.id = channel_accounts.tenant_id
                 WHERE channel_accounts.id = $1 AND tenants.id = $2`,
                [mapping.channelAccountId, tenantId],
              );
              if (account[0]?.status !== 'CONNECTED') {
                results.skipped++;
                continue;
              }

              // There is deliberately no mock fallback here. A CONNECTED
              // account must have the official provider contract installed
              // before an outbox worker can publish sellable stock.
              throw new Error(
                `No production ${mapping.channel} stock publisher is configured`,
              );
            } catch (error: unknown) {
              results.failed++;
              await this.recordSyncException(
                schemaName,
                mapping.channelAccountId,
                master_sku_id,
                mapping.channel,
                getErrorMessage(error),
              );
              this.logger.error(
                `Failed to sync ${master_sku_id} to ${mapping.channel}: ${getErrorMessage(error)}`,
              );

              results.details.push({
                masterSkuId: master_sku_id,
                channel: mapping.channel,
                itemId: mapping.externalItemId,
                error: getErrorMessage(error),
                status: 'failed',
              });
            }
          }
        } catch (error: unknown) {
          results.failed++;
          this.logger.error(
            `Failed to process item ${master_sku_id}: ${getErrorMessage(error)}`,
          );
        }
      }

      // Log batch sync to audit
      await this.dataSource.query(
        `INSERT INTO "${schemaName}".audit_logs (user_id, action, entity_type, entity_id, changes)
         VALUES (NULL, 'BATCH_STOCK_SYNC', 'tenant', $1, $2)`,
        [tenantId, JSON.stringify(results)],
      );

      this.logger.log(
        `Batch sync completed: ${results.synced} synced, ${results.skipped} skipped, ${results.failed} failed`,
      );

      return results;
    } catch (error: unknown) {
      this.logger.error(
        `Batch sync job ${job.id} failed: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async recordSyncException(
    schemaName: string,
    channelAccountId: string | undefined,
    masterSkuId: string,
    channel: string,
    message: string,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO "${schemaName}".integration_exceptions
       (channel_account_id, exception_type, severity, message, context)
       VALUES ($1, 'STOCK_SYNC_FAILED', 'HIGH', $2, $3)`,
      [
        channelAccountId ?? null,
        message,
        JSON.stringify({ masterSkuId, channel }),
      ],
    );
  }
}
