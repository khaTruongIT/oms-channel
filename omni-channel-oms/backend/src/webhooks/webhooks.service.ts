import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WebhookOrderDto } from './dto/webhook-order.dto';
import { ShopeeService } from '../integrations/shopee/shopee.service';
import { TiktokService } from '../integrations/tiktok/tiktok.service';
import { LazadaService } from '../integrations/lazada/lazada.service';
import { ChannelMappingsService } from '../channel-mappings/channel-mappings.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly shopeeService: ShopeeService,
    private readonly tiktokService: TiktokService,
    private readonly lazadaService: LazadaService,
    private readonly channelMappingsService: ChannelMappingsService,
    private readonly ordersService: OrdersService,
  ) {}

  async handleOrderWebhook(
    webhookOrderDto: WebhookOrderDto,
    schemaName: string,
    userId: string,
  ): Promise<any> {
    const {
      channel,
      orderId,
      itemId,
      variantId,
      quantity,
      price,
      customerName,
      customerPhone,
    } = webhookOrderDto;

    this.logger.log(
      `Received webhook order from ${channel}: ${orderId}, item: ${itemId}, quantity: ${quantity}`,
    );

    // Find master SKU from channel mapping
    const masterSkuId =
      await this.channelMappingsService.findMasterSkuByExternalId(
        channel,
        itemId,
        variantId || null,
        schemaName,
      );

    if (!masterSkuId) {
      this.logger.warn(
        `No mapping found for ${channel} item ${itemId}, variant ${variantId || 'none'}. Skipping order.`,
      );
      return {
        status: 'skipped',
        reason: 'No product mapping found',
      };
    }

    // Get default warehouse (first active warehouse)
    const warehouses = await this.dataSource.query(
      `SELECT id FROM "${schemaName}".warehouses WHERE is_active = TRUE LIMIT 1`,
    );

    if (warehouses.length === 0) {
      throw new NotFoundException('No active warehouse found');
    }

    const warehouseId = warehouses[0].id;

    // Create order in OMS
    try {
      const order = await this.ordersService.createOrder(
        {
          channel,
          externalOrderId: orderId,
          customerName: customerName || 'Unknown Customer',
          customerPhone: customerPhone || 'N/A',
          items: [
            {
              masterSkuId,
              quantity,
              unitPrice: price,
            },
          ],
          warehouseId,
        },
        userId,
        schemaName,
      );

      this.logger.log(
        `Successfully created order ${order.orderNumber} from webhook`,
      );

      return {
        status: 'success',
        orderNumber: order.orderNumber,
        orderId: order.id,
      };
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        this.logger.warn(`Order ${orderId} already exists (idempotency check)`);
        return {
          status: 'duplicate',
          message: 'Order already processed',
        };
      }

      throw error;
    }
  }
}
