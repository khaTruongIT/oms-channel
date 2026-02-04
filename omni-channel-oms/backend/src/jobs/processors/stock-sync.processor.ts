import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { DataSource } from 'typeorm';
import { StockSyncJob } from '../dto/job-data.interface';
import { ShopeeService } from '../../integrations/shopee/shopee.service';
import { TiktokService } from '../../integrations/tiktok/tiktok.service';
import { LazadaService } from '../../integrations/lazada/lazada.service';
import { ChannelMappingsService } from '../../channel-mappings/channel-mappings.service';

interface SyncResult {
  channel: string;
  itemId: string;
  variantId?: string;
  status: string;
  error?: string;
}

@Processor('stock-sync')
export class StockSyncProcessor {
  private readonly logger = new Logger(StockSyncProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly shopeeService: ShopeeService,
    private readonly tiktokService: TiktokService,
    private readonly lazadaService: LazadaService,
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
          const service = this.getMarketplaceService(mapping.channel);

          await service.updateStock(
            mapping.externalItemId,
            mapping.externalVariantId || null,
            quantity,
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
        } catch (error: any) {
          this.logger.error(
            `Failed to update stock on ${mapping.channel}: ${error.message}`,
            error.stack,
          );

          results.push({
            channel: mapping.channel,
            itemId: mapping.externalItemId,
            error: error.message,
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
    } catch (error: any) {
      this.logger.error(
        `Stock sync job ${job.id} failed: ${error.message}`,
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
