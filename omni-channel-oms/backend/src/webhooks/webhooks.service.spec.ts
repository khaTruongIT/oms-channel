import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { ShopeeService } from '../integrations/shopee/shopee.service';
import { TiktokService } from '../integrations/tiktok/tiktok.service';
import { LazadaService } from '../integrations/lazada/lazada.service';
import { ChannelMappingsService } from '../channel-mappings/channel-mappings.service';
import { OrdersService } from '../orders/orders.service';
import { ChannelAccountsService } from '../channel-accounts/channel-accounts.service';
import { IntegrationOperationsService } from '../integration-operations/integration-operations.service';
import { ErrorCode } from '../common/errors/error-codes';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let channelMappingsService: Partial<ChannelMappingsService>;
  let ordersService: Partial<OrdersService>;
  let integrationOperationsService: Partial<IntegrationOperationsService>;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    channelMappingsService = {
      findMasterSkuByExternalId: jest.fn(),
    };
    ordersService = {
      createOrder: jest.fn(),
    };
    integrationOperationsService = {
      createException: jest.fn(),
    };
    dataSource = {
      query: jest.fn().mockResolvedValue([{ id: 'wh-default-1' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: DataSource, useValue: dataSource },
        { provide: ShopeeService, useValue: {} },
        { provide: TiktokService, useValue: {} },
        { provide: LazadaService, useValue: {} },
        { provide: ChannelMappingsService, useValue: channelMappingsService },
        { provide: OrdersService, useValue: ordersService },
        { provide: ChannelAccountsService, useValue: {} },
        {
          provide: IntegrationOperationsService,
          useValue: integrationOperationsService,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  describe('handleOrderWebhook', () => {
    const baseDto = {
      channel: 'shopee',
      orderId: 'EXT-ORD-100',
      itemId: 'ITEM-99',
      variantId: 'VAR-1',
      quantity: 2,
      price: 50.0,
      customerName: 'Nguyen Van A',
      customerPhone: '0901234567',
    };

    it('S3.1.3: creates UNMAPPED_SKU exception with redacted PII when mapping is missing', async () => {
      (
        channelMappingsService.findMasterSkuByExternalId as jest.Mock
      ).mockResolvedValue(null);

      const result = await service.handleOrderWebhook(
        baseDto,
        'tenant_test',
        'user-1',
      );

      expect(result).toEqual({
        status: 'skipped',
        reason: 'No product mapping found',
      });

      expect(integrationOperationsService.createException).toHaveBeenCalledWith(
        'tenant_test',
        expect.objectContaining({
          type: ErrorCode.UNMAPPED_SKU,
          severity: 'HIGH',
          context: expect.objectContaining({
            channel: 'shopee',
            orderId: 'EXT-ORD-100',
            itemId: 'ITEM-99',
            variantId: 'VAR-1',
            customerName: 'N***',
            customerPhone: '***REDACTED***',
          }),
        }),
      );
    });

    it('S3.1.4: recognizes duplicate order by ORDER_DUPLICATE code even if message changes', async () => {
      (
        channelMappingsService.findMasterSkuByExternalId as jest.Mock
      ).mockResolvedValue('sku-uuid-1');

      (ordersService.createOrder as jest.Mock).mockRejectedValue(
        new ConflictException({
          code: ErrorCode.ORDER_DUPLICATE,
          message: 'Custom message for duplicated order record',
        }),
      );

      const result = await service.handleOrderWebhook(
        baseDto,
        'tenant_test',
        'user-1',
      );

      expect(result).toEqual({
        status: 'duplicate',
        message: 'Order already processed',
      });
    });

    it('creates order successfully when SKU is mapped and no duplicate', async () => {
      (
        channelMappingsService.findMasterSkuByExternalId as jest.Mock
      ).mockResolvedValue('sku-uuid-1');

      (ordersService.createOrder as jest.Mock).mockResolvedValue({
        id: 'ord-123',
        orderNumber: 'ORD-2026-001',
      });

      const result = await service.handleOrderWebhook(
        baseDto,
        'tenant_test',
        'user-1',
      );

      expect(result).toEqual({
        status: 'success',
        orderNumber: 'ORD-2026-001',
        orderId: 'ord-123',
      });
    });
  });
});
