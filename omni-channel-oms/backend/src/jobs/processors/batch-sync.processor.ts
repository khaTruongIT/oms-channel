import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { DataSource } from 'typeorm';
import { BatchStockSyncJob } from '../dto/job-data.interface';
import { ShopeeService } from '../../integrations/shopee/shopee.service';
import { TiktokService } from '../../integrations/tiktok/tiktok.service';
import { LazadaService } from '../../integrations/lazada/lazada.service';
import { ChannelMappingsService } from '../../channel-mappings/channel-mappings.service';

@Processor('batch-sync')
export class BatchSyncProcessor {
  private readonly logger = new Logger(BatchSyncProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly shopeeService: ShopeeService,
    private readonly tiktokService: TiktokService,
    private readonly lazadaService: LazadaService,
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
      const inventory = await this.dataSource.query(
        `SELECT i.master_sku_id, i.warehouse_id, i.quantity
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
        details: [] as any[],
      };

      for (const item of inventory) {
        const { master_sku_id, warehouse_id, quantity } = item;

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
              const service = this.getMarketplaceService(mapping.channel);

              await service.updateStock(
                mapping.externalItemId,
                mapping.externalVariantId || null,
                parseInt(quantity),
              );

              results.synced++;

              results.details.push({
                masterSkuId: master_sku_id,
                channel: mapping.channel,
                itemId: mapping.externalItemId,
                quantity: parseInt(quantity),
                status: 'success',
              });
            } catch (error: any) {
              results.failed++;
              this.logger.error(
                `Failed to sync ${master_sku_id} to ${mapping.channel}: ${error.message}`,
              );

              results.details.push({
                masterSkuId: master_sku_id,
                channel: mapping.channel,
                error: error.message,
                status: 'failed',
              });
            }
          }
        } catch (error: any) {
          results.failed++;
          this.logger.error(
            `Failed to process item ${master_sku_id}: ${error.message}`,
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
    } catch (error: any) {
      this.logger.error(
        `Batch sync job ${job.id} failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private getMarketplaceService(channel: string) {
    switch (channel) {
      case 'shopee':
        return this.shopeeService;
      case 'tiktok':
        return this.tiktokService;
      case 'lazada':
        return this.lazadaService;
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }
}
