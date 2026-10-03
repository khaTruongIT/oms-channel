import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { DataSource } from 'typeorm';
import { StockSyncJob } from '../dto/job-data.interface';
import { ChannelMappingsService } from '../../channel-mappings/channel-mappings.service';

interface SyncResult {
  channel: string;
  itemId: string;
  variantId?: string;
  status: string;
  error?: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown stock sync error';
}

@Processor('stock-sync')
export class StockSyncProcessor {
  private readonly logger = new Logger(StockSyncProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly channelMappingsService: ChannelMappingsService,
  ) {}

  @Process('sync-product-stock')
  async handleStockSync(job: Job<StockSyncJob>) {
    const { masterSkuId, warehouseId, quantity, schemaName } = job.data;

    this.logger.log(
      `Processing stock sync job ${job.id}: SKU ${masterSkuId}, Warehouse ${warehouseId}, Qty ${quantity}`,
    );

    try {
      // Get all channel mappings for this master SKU
      const mappings = await this.channelMappingsService.getMappingsByMasterSku(
        masterSkuId,
        schemaName,
      );

      if (mappings.length === 0) {
        this.logger.warn(
          `No channel mappings found for master SKU ${masterSkuId}`,
        );
        return { status: 'skipped', reason: 'No channel mappings' };
      }

      const results: SyncResult[] = [];

      // Update stock on all mapped channels
      for (const mapping of mappings) {
        try {
          throw new Error(
            `No production ${mapping.channel} stock publisher is configured; mock adapters are disabled for pilot sync`,
          );

          results.push({
            channel: mapping.channel,
            itemId: mapping.externalItemId,
            variantId: mapping.externalVariantId,
            status: 'success',
          });

          this.logger.log(
            `Updated stock on ${mapping.channel} for item ${mapping.externalItemId}: ${quantity}`,
          );
        } catch (error: unknown) {
          await this.dataSource.query(
            `INSERT INTO "${schemaName}".integration_exceptions
             (exception_type, severity, message, context)
             VALUES ('STOCK_SYNC_FAILED', 'HIGH', $1, $2)`,
            [
              getErrorMessage(error),
              JSON.stringify({
                masterSkuId,
                channel: mapping.channel,
                externalItemId: mapping.externalItemId,
              }),
            ],
          );
          this.logger.error(
            `Failed to update stock on ${mapping.channel}: ${getErrorMessage(error)}`,
            error instanceof Error ? error.stack : undefined,
          );

          results.push({
            channel: mapping.channel,
            itemId: mapping.externalItemId,
            error: getErrorMessage(error),
            status: 'failed',
          });
        }
      }

      // Log sync to audit table
      await this.dataSource.query(
        `INSERT INTO "${schemaName}".audit_logs (user_id, action, entity_type, entity_id, changes)
         VALUES (NULL, 'STOCK_SYNC', 'inventory', $1, $2)`,
        [masterSkuId, JSON.stringify({ quantity, results })],
      );

      return {
        status: 'completed',
        masterSkuId,
        quantity,
        results,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Stock sync job ${job.id} failed: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
