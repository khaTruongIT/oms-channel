import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateChannelMappingDto } from './dto/create-channel-mapping.dto';
import { ChannelAccountsService } from '../channel-accounts/channel-accounts.service';

export interface ChannelMapping {
  id: string;
  masterSkuId: string;
  channelAccountId?: string;
  channel: string;
  externalItemId: string;
  externalVariantId?: string;
}

@Injectable()
export class ChannelMappingsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly channelAccountsService: ChannelAccountsService,
  ) {}

  async createMapping(
    createChannelMappingDto: CreateChannelMappingDto,
    schemaName: string,
    tenantId?: string,
  ): Promise<ChannelMapping> {
    const {
      masterSkuId,
      channelAccountId,
      channel,
      externalItemId,
      externalVariantId,
    } = createChannelMappingDto;

    if (channelAccountId) {
      if (!tenantId) {
        throw new NotFoundException('Tenant information not found');
      }
      await this.channelAccountsService.getForTenant(
        channelAccountId,
        tenantId,
      );
    }

    // Check if master SKU exists
    const skuExists = await this.dataSource.query<Array<{ id: string }>>(
      `SELECT id FROM "${schemaName}".master_skus WHERE id = $1 AND deleted_at IS NULL`,
      [masterSkuId],
    );

    if (skuExists.length === 0) {
      throw new NotFoundException('Master SKU not found');
    }

    // Check for duplicate mapping
    const existing = await this.dataSource.query<Array<{ id: string }>>(
      `SELECT id FROM "${schemaName}".channel_mappings 
       WHERE channel = $1
         AND channel_account_id IS NOT DISTINCT FROM $2
         AND external_item_id = $3
         AND external_variant_id IS NOT DISTINCT FROM $4`,
      [
        channel,
        channelAccountId ?? null,
        externalItemId,
        externalVariantId ?? null,
      ],
    );

    if (existing.length > 0) {
      throw new ConflictException(
        'Channel mapping already exists for this item',
      );
    }

    const result = await this.dataSource.query<ChannelMappingRow[]>(
      `INSERT INTO "${schemaName}".channel_mappings (master_sku_id, channel_account_id, channel, external_item_id, external_variant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        masterSkuId,
        channelAccountId ?? null,
        channel,
        externalItemId,
        externalVariantId ?? null,
      ],
    );

    return this.mapToChannelMapping(result[0]);
  }

  async getMappingsByMasterSku(
    masterSkuId: string,
    schemaName: string,
  ): Promise<ChannelMapping[]> {
    const results = await this.dataSource.query<ChannelMappingRow[]>(
      `SELECT * FROM "${schemaName}".channel_mappings WHERE master_sku_id = $1`,
      [masterSkuId],
    );

    return results.map((row) => this.mapToChannelMapping(row));
  }

  async getMappingsByChannel(
    channel: string,
    schemaName: string,
  ): Promise<ChannelMapping[]> {
    const results = await this.dataSource.query<ChannelMappingRow[]>(
      `SELECT * FROM "${schemaName}".channel_mappings WHERE channel = $1`,
      [channel],
    );

    return results.map((row) => this.mapToChannelMapping(row));
  }

  async findMasterSkuByExternalId(
    channel: string,
    externalItemId: string,
    externalVariantId: string | null,
    schemaName: string,
  ): Promise<string | null> {
    const result = await this.dataSource.query<
      Array<{ master_sku_id: string }>
    >(
      `SELECT master_sku_id FROM "${schemaName}".channel_mappings 
       WHERE channel = $1 AND external_item_id = $2 AND (external_variant_id = $3 OR ($3 IS NULL AND external_variant_id IS NULL))`,
      [channel, externalItemId, externalVariantId],
    );

    return result.length > 0 ? result[0].master_sku_id : null;
  }

  async getAllMappings(schemaName: string): Promise<ChannelMapping[]> {
    const results = await this.dataSource.query<ChannelMappingRow[]>(
      `SELECT * FROM "${schemaName}".channel_mappings ORDER BY channel, external_item_id`,
    );

    return results.map((row) => this.mapToChannelMapping(row));
  }

  async deleteMapping(id: string, schemaName: string): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `DELETE FROM "${schemaName}".channel_mappings WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Channel mapping not found');
    }
  }

  private mapToChannelMapping(row: ChannelMappingRow): ChannelMapping {
    return {
      id: row.id,
      masterSkuId: row.master_sku_id,
      channelAccountId: row.channel_account_id ?? undefined,
      channel: row.channel,
      externalItemId: row.external_item_id,
      externalVariantId: row.external_variant_id ?? undefined,
    };
  }
}

interface ChannelMappingRow {
  id: string;
  master_sku_id: string;
  channel_account_id?: string | null;
  channel: string;
  external_item_id: string;
  external_variant_id?: string | null;
}
