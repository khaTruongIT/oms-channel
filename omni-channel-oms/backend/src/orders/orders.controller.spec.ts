import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<Partial<OrdersService>>;

  const mockReq = {
    user: {
      userId: '11111111-1111-1111-1111-111111111111',
      tenantId: '22222222-2222-2222-2222-222222222222',
      schemaName: 'tenant_test',
      role: 'OWNER',
    },
  };

  beforeEach(async () => {
    ordersService = {
      createOrder: jest.fn(),
      getAllOrders: jest.fn(),
      getOrderById: jest.fn(),
      getOrderItems: jest.fn(),
      updateOrderStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('delegates getAllOrders with query filters to service', async () => {
    const query: GetOrdersQueryDto = {
      status: 'CONFIRMED',
      externalOrderId: 'EXT-100',
      channelAccountId: '33333333-3333-3333-3333-333333333333',
      channel: 'TIKTOK',
    };

    ordersService.getAllOrders!.mockResolvedValue([
      {
        id: 'ord-1',
        orderNumber: 'ORD-1',
        channel: 'TIKTOK',
        status: 'CONFIRMED',
        externalOrderId: 'EXT-100',
        totalAmount: 100,
        createdAt: new Date(),
      },
    ]);

    const res = await controller.getAllOrders(mockReq, query);
    expect(res).toHaveLength(1);
    expect(ordersService.getAllOrders).toHaveBeenCalledWith(
      'tenant_test',
      query,
    );
  });

  it('delegates paginated query with page and limit to service', async () => {
    const query: GetOrdersQueryDto = {
      page: 2,
      limit: 10,
      q: 'search-keyword',
    };

    ordersService.getAllOrders!.mockResolvedValue({
      data: [],
      meta: {
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: true,
      },
    });

    const res = await controller.getAllOrders(mockReq, query);
    expect('meta' in res).toBe(true);
    expect(ordersService.getAllOrders).toHaveBeenCalledWith(
      'tenant_test',
      query,
    );
  });

  it('delegates getOrderTimeline to service', async () => {
    ordersService.getOrderTimeline = jest.fn().mockResolvedValue([
      {
        id: 'audit-1',
        type: 'AUDIT',
        event: 'ORDER_CREATED',
        description: 'Order created',
        timestamp: new Date(),
      },
    ]);

    const res = await controller.getOrderTimeline(
      mockReq,
      '11111111-1111-1111-1111-111111111111',
    );
    expect(res).toHaveLength(1);
    expect(ordersService.getOrderTimeline).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      'tenant_test',
    );
  });

  it('delegates bulkUpdateOrderStatus with idempotency key to service', async () => {
    const bulkDto = {
      ids: ['11111111-1111-1111-1111-111111111111'],
      status: 'CONFIRMED',
    };

    ordersService.bulkUpdateOrderStatus = jest.fn().mockResolvedValue({
      succeeded: ['11111111-1111-1111-1111-111111111111'],
      failed: [],
      total: 1,
      successCount: 1,
      failureCount: 0,
    });

    const res = await controller.bulkUpdateOrderStatus(
      mockReq,
      bulkDto,
      'idemp-header-123',
    );
    expect(res.successCount).toBe(1);
    expect(ordersService.bulkUpdateOrderStatus).toHaveBeenCalledWith(
      bulkDto,
      '11111111-1111-1111-1111-111111111111',
      'tenant_test',
      'idemp-header-123',
    );
  });
});
