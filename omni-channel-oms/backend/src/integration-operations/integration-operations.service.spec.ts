import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { IntegrationOperationsService } from './integration-operations.service';
import { ChannelAccountsService } from '../channel-accounts/channel-accounts.service';
import { ChannelMappingsService } from '../channel-mappings/channel-mappings.service';
import { OrdersService } from '../orders/orders.service';
import { ErrorCode } from '../common/errors/error-codes';

describe('IntegrationOperationsService', () => {
  let service: IntegrationOperationsService;
  let dataSource: { query: jest.Mock };
  let channelMappingsService: Partial<ChannelMappingsService>;
  let ordersService: Partial<OrdersService>;

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    };
    channelMappingsService = {
      findMasterSkuByExternalId: jest.fn(),
      createMapping: jest.fn(),
    };
    ordersService = {
      createOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationOperationsService,
        { provide: DataSource, useValue: dataSource },
        { provide: ChannelAccountsService, useValue: {} },
        { provide: OrdersService, useValue: ordersService },
        { provide: ChannelMappingsService, useValue: channelMappingsService },
      ],
    }).compile();

    service = module.get<IntegrationOperationsService>(
      IntegrationOperationsService,
    );
  });

  describe('retryException', () => {
    it('S3.1.5: rejects concurrent retries with 409 ConflictException when already RETRYING', async () => {
      // Atomic lock returns 0 rows because status is already RETRYING
      dataSource.query
        .mockResolvedValueOnce([]) // UPDATE ... WHERE status <> 'RETRYING' returns []
        .mockResolvedValueOnce([
          { id: 'ex-1', status: 'RETRYING' },
        ]); // SELECT returns existing with status RETRYING

      await expect(
        service.retryException('ex-1', 'tenant_test'),
      ).rejects.toThrow(ConflictException);
    });

    it('S3.1.5: successfully resolves exception when mapping now exists and order creates', async () => {
      const mockExceptionRow = {
        id: 'ex-1',
        exception_type: ErrorCode.UNMAPPED_SKU,
        status: 'RETRYING',
        context: {
          channel: 'shopee',
          orderId: 'ORD-999',
          itemId: 'ITEM-1',
          variantId: null,
          quantity: 2,
          price: 100,
        },
      };

      dataSource.query
        .mockResolvedValueOnce([mockExceptionRow]) // UPDATE to RETRYING succeeds
        .mockResolvedValueOnce([{ id: 'wh-1' }]) // SELECT warehouses
        .mockResolvedValueOnce([
          { ...mockExceptionRow, status: 'RESOLVED', retry_count: 0 },
        ]); // UPDATE to RESOLVED

      (
        channelMappingsService.findMasterSkuByExternalId as jest.Mock
      ).mockResolvedValue('sku-master-1');
      (ordersService.createOrder as jest.Mock).mockResolvedValue({
        id: 'ord-new',
      });

      const res = await service.retryException('ex-1', 'tenant_test');

      expect(ordersService.createOrder).toHaveBeenCalled();
      expect(res.status).toBe('RESOLVED');
    });

    it('S3.1.5: increments retry_count and sets status OPEN when retry fails', async () => {
      const mockExceptionRow = {
        id: 'ex-2',
        exception_type: ErrorCode.UNMAPPED_SKU,
        status: 'RETRYING',
        context: {
          channel: 'shopee',
          itemId: 'ITEM-STILL-MISSING',
        },
      };

      dataSource.query
        .mockResolvedValueOnce([mockExceptionRow]) // UPDATE to RETRYING succeeds
        .mockResolvedValueOnce([
          { ...mockExceptionRow, status: 'OPEN', retry_count: 1 },
        ]); // UPDATE to OPEN

      (
        channelMappingsService.findMasterSkuByExternalId as jest.Mock
      ).mockResolvedValue(null);

      const res = await service.retryException('ex-2', 'tenant_test');

      expect(res.status).toBe('OPEN');
      expect(res.retryCount).toBe(1);
    });
  });

  describe('mapSkuAndRetry', () => {
    it('S3.1.6: creates channel mapping then calls retryException to resolve', async () => {
      const mockExceptionRow = {
        id: 'ex-3',
        exception_type: ErrorCode.UNMAPPED_SKU,
        status: 'OPEN',
        context: {
          channel: 'shopee',
          itemId: 'ITEM-MAP-NOW',
        },
      };

      dataSource.query
        .mockResolvedValueOnce([mockExceptionRow]) // SELECT existing exception
        .mockResolvedValueOnce([mockExceptionRow]) // retry: UPDATE to RETRYING
        .mockResolvedValueOnce([{ id: 'wh-1' }]) // retry: SELECT warehouses
        .mockResolvedValueOnce([
          { ...mockExceptionRow, status: 'RESOLVED', retry_count: 0 },
        ]); // retry: UPDATE to RESOLVED

      (channelMappingsService.createMapping as jest.Mock).mockResolvedValue({
        id: 'map-1',
      });
      (
        channelMappingsService.findMasterSkuByExternalId as jest.Mock
      ).mockResolvedValue('sku-123');
      (ordersService.createOrder as jest.Mock).mockResolvedValue({
        id: 'ord-123',
      });

      const res = await service.mapSkuAndRetry(
        'ex-3',
        'sku-123',
        'tenant_test',
        'tenant-id-1',
      );

      expect(channelMappingsService.createMapping).toHaveBeenCalledWith(
        expect.objectContaining({
          masterSkuId: 'sku-123',
          channel: 'shopee',
          externalItemId: 'ITEM-MAP-NOW',
        }),
        'tenant_test',
        'tenant-id-1',
      );
      expect(res.status).toBe('RESOLVED');
    });
  });
});
