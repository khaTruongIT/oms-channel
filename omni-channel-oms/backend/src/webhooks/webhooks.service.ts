import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WebhookOrderDto } from './dto/webhook-order.dto';
import { ShopeeService } from '../integrations/shopee/shopee.service';
import { TiktokService } from '../integrations/tiktok/tiktok.service';
import { LazadaService } from '../integrations/lazada/lazada.service';
import { ChannelMappingsService } from '../channel-mappings/channel-mappings.service';
import { OrdersService } from '../orders/orders.service';
import { ChannelAccountsService } from '../channel-accounts/channel-accounts.service';
import { ChannelAccountStatus } from '../database/entities/channel-account.entity';
import { IntegrationOperationsService } from '../integration-operations/integration-operations.service';
import { ErrorCode } from '../common/errors/error-codes';

type LegacyWebhookResult =
  | { status: 'skipped'; reason: string }
  | { status: 'success'; orderNumber: string; orderId: string }
  | { status: 'duplicate'; message: string };

interface WarehouseRow {
  id: string;
}

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
    private readonly channelAccountsService: ChannelAccountsService,
    private readonly integrationOperationsService: IntegrationOperationsService,
  ) {}

  async receiveShopeeWebhook(
    callbackId: string,
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<never> {
    const account =
      await this.channelAccountsService.findForWebhook(callbackId);
    const receivedSignature = headers['x-shopee-signature'];
    const hasSignature =
      typeof receivedSignature === 'string' ||
      (Array.isArray(receivedSignature) && receivedSignature.length > 0);

    if (account.status !== ChannelAccountStatus.CONNECTED || !hasSignature) {
      throw new ServiceUnavailableException(
        'Shopee webhook verification is unavailable until the Partner contract is configured',
      );
    }

    // Never infer a signing algorithm or delivery id. This is deliberately
    // fail-closed until the official Partner contract supplies both values.
    void rawBody;
    throw new ServiceUnavailableException(
      'Shopee webhook verifier is not configured for this account',
    );
  }

  async handleOrderWebhook(
    webhookOrderDto: WebhookOrderDto,
    schemaName: string,
    userId: string,
  ): Promise<LegacyWebhookResult> {
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
        `No mapping found for ${channel} item ${itemId}, variant ${variantId || 'none'}. Creating UNMAPPED_SKU exception and skipping order.`,
      );

      // S3.1.3: Create integration exception with redacted payload
      await this.integrationOperationsService.createException(schemaName, {
        type: ErrorCode.UNMAPPED_SKU,
        severity: 'HIGH',
        message: `No product mapping found for ${channel} item ${itemId}, variant ${variantId || 'none'}`,
        context: {
          channel,
          orderId,
          itemId,
          variantId: variantId || null,
          quantity,
          price,
          customerName: customerName ? `${customerName.slice(0, 1)}***` : undefined,
          customerPhone: customerPhone ? '***REDACTED***' : undefined,
        },
      });

      return {
        status: 'skipped',
        reason: 'No product mapping found',
      };
    }

    // Get default warehouse (first active warehouse)
    const warehouses = await this.dataSource.query<WarehouseRow[]>(
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
    } catch (error: unknown) {
      // S3.1.4: Check ORDER_DUPLICATE error code
      if (this.isDuplicateOrderError(error)) {
        this.logger.warn(`Order ${orderId} already exists (idempotency check)`);
        return {
          status: 'duplicate',
          message: 'Order already processed',
        };
      }

      throw error;
    }
  }

  private isDuplicateOrderError(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const resp = (error as any).response;
      if (resp && typeof resp === 'object' && resp.code === ErrorCode.ORDER_DUPLICATE) {
        return true;
      }
      if ((error as any).code === ErrorCode.ORDER_DUPLICATE) {
        return true;
      }
    }
    return error instanceof Error && error.message.includes('already exists');
  }
}
