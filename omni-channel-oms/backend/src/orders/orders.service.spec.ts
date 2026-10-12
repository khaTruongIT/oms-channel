import { DataSource, QueryRunner } from 'typeorm';
import { InventoryService } from '../inventory/inventory.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

type QueryFn = (query: string, parameters?: unknown[]) => Promise<unknown[]>;

interface QueryRunnerMock extends Pick<
  QueryRunner,
  | 'connect'
  | 'startTransaction'
  | 'commitTransaction'
  | 'rollbackTransaction'
  | 'release'
  | 'query'
> {
  query: jest.MockedFunction<QueryFn>;
}

function createQueryRunnerMock(): QueryRunnerMock {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    query: jest.fn<QueryFn>(),
  };
}

function createOrderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    order_number: 'ORD-1',
    channel: 'shopee',
    external_order_id: 'external-1',
    customer_name: 'Customer',
    customer_phone: '0900000000',
    status: 'PENDING',
    total_amount: '25.50',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    synced_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createOrderItemRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    order_id: 'order-1',
    master_sku_id: 'sku-1',
    warehouse_id: 'warehouse-1',
    quantity: 2,
    unit_price: '12.75',
    subtotal: '25.50',
    ...overrides,
  };
}

function createInventoryServiceMock() {
  return {
    reserveStock: jest.fn().mockResolvedValue({
      id: 'inventory-1',
      masterSkuId: 'sku-1',
      warehouseId: 'warehouse-1',
      quantity: 10,
      reservedQuantity: 1,
      safetyStock: 0,
      availableQuantity: 9,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    deductStock: jest.fn().mockResolvedValue({
      id: 'inventory-1',
      masterSkuId: 'sku-1',
      warehouseId: 'warehouse-1',
      quantity: 8,
      reservedQuantity: 0,
      safetyStock: 0,
      availableQuantity: 8,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    releaseReservation: jest.fn().mockResolvedValue({
      id: 'inventory-1',
      masterSkuId: 'sku-1',
      warehouseId: 'warehouse-1',
      quantity: 10,
      reservedQuantity: 0,
      safetyStock: 0,
      availableQuantity: 10,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    restockStock: jest.fn().mockResolvedValue({
      id: 'inventory-1',
      masterSkuId: 'sku-1',
      warehouseId: 'warehouse-1',
      quantity: 10,
      reservedQuantity: 0,
      safetyStock: 0,
      availableQuantity: 10,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
  };
}

describe('OrdersService', () => {
  it('reserves stock using the same query runner transaction when creating orders', async () => {
    const queryRunner = createQueryRunnerMock();
    const dataSource = {
      query: jest.fn().mockResolvedValue([]),
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };
    const inventoryService = createInventoryServiceMock();

    queryRunner.query
      .mockResolvedValueOnce([{ id: 'cust-1' }])
      .mockResolvedValueOnce([createOrderRow({ customer_id: 'cust-1' })])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const service = new OrdersService(
      dataSource as unknown as DataSource,
      inventoryService as unknown as InventoryService,
    );

    const createOrderDto: CreateOrderDto = {
      channel: 'shopee',
      externalOrderId: 'external-1',
      customerName: 'Customer',
      customerPhone: '0900000000',
      warehouseId: 'warehouse-1',
      items: [{ masterSkuId: 'sku-1', quantity: 1, unitPrice: 25.5 }],
    };

    await service.createOrder(createOrderDto, 'user-1', 'tenant_schema');

    expect(inventoryService.reserveStock).toHaveBeenCalledWith(
      {
        masterSkuId: 'sku-1',
        warehouseId: 'warehouse-1',
        quantity: 1,
      },
      'tenant_schema',
      queryRunner,
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('deducts reserved stock in the same transaction when confirming a pending order', async () => {
    const queryRunner = createQueryRunnerMock();
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };
    const inventoryService = createInventoryServiceMock();

    queryRunner.query
      .mockResolvedValueOnce([createOrderRow({ status: 'PENDING' })])
      .mockResolvedValueOnce([createOrderItemRow({ quantity: 2 })])
      .mockResolvedValueOnce([{ warehouse_id: 'warehouse-1' }])
      .mockResolvedValueOnce([createOrderRow({ status: 'CONFIRMED' })])
      .mockResolvedValueOnce([]);

    const service = new OrdersService(
      dataSource as unknown as DataSource,
      inventoryService as unknown as InventoryService,
    );

    await service.updateOrderStatus(
      'order-1',
      { status: 'CONFIRMED' },
      'user-1',
      'tenant_schema',
    );

    expect(inventoryService.deductStock).toHaveBeenCalledWith(
      'sku-1',
      'warehouse-1',
      2,
      'user-1',
      'tenant_schema',
      queryRunner,
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('releases reserved stock in the same transaction when cancelling a pending order', async () => {
    const queryRunner = createQueryRunnerMock();
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };
    const inventoryService = createInventoryServiceMock();

    queryRunner.query
      .mockResolvedValueOnce([createOrderRow({ status: 'PENDING' })])
      .mockResolvedValueOnce([createOrderItemRow({ quantity: 2 })])
      .mockResolvedValueOnce([{ warehouse_id: 'warehouse-1' }])
      .mockResolvedValueOnce([createOrderRow({ status: 'CANCELLED' })])
      .mockResolvedValueOnce([]);

    const service = new OrdersService(
      dataSource as unknown as DataSource,
      inventoryService as unknown as InventoryService,
    );

    await service.updateOrderStatus(
      'order-1',
      { status: 'CANCELLED', reason: 'Customer changed mind' },
      'user-1',
      'tenant_schema',
    );

    expect(inventoryService.releaseReservation).toHaveBeenCalledWith(
      'sku-1',
      'warehouse-1',
      2,
      'tenant_schema',
      queryRunner,
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('restocks deducted stock when cancelling a confirmed order', async () => {
    const queryRunner = createQueryRunnerMock();
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };
    const inventoryService = createInventoryServiceMock();

    queryRunner.query
      .mockResolvedValueOnce([createOrderRow({ status: 'CONFIRMED' })])
      .mockResolvedValueOnce([createOrderItemRow({ quantity: 2 })])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createOrderRow({ status: 'CANCELLED' })])
      .mockResolvedValueOnce([]);

    const service = new OrdersService(
      dataSource as unknown as DataSource,
      inventoryService as unknown as InventoryService,
    );

    await service.updateOrderStatus(
      'order-1',
      { status: 'CANCELLED', reason: 'Defective item reported' },
      'user-1',
      'tenant_schema',
    );

    expect(inventoryService.restockStock).toHaveBeenCalledWith(
      'sku-1',
      'warehouse-1',
      2,
      'tenant_schema',
      queryRunner,
    );
  });

  it('throws BadRequestException when cancelling without a reason (S2.1.6)', async () => {
    const service = new OrdersService(
      {} as unknown as DataSource,
      createInventoryServiceMock() as unknown as InventoryService,
    );

    await expect(
      service.updateOrderStatus(
        'order-1',
        { status: 'CANCELLED' },
        'user-1',
        'tenant_schema',
      ),
    ).rejects.toThrow('reason is required when cancelling an order');
  });

  it('throws ConflictException with ORDER_STATE_CONFLICT when status transition is invalid (S2.1.6)', async () => {
    const queryRunner = createQueryRunnerMock();
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };
    queryRunner.query.mockResolvedValueOnce([
      createOrderRow({ status: 'SHIPPED' }),
    ]);

    const service = new OrdersService(
      dataSource as unknown as DataSource,
      createInventoryServiceMock() as unknown as InventoryService,
    );

    await expect(
      service.updateOrderStatus(
        'order-1',
        { status: 'CANCELLED', reason: 'Cancel after ship' },
        'user-1',
        'tenant_schema',
      ),
    ).rejects.toMatchObject({
      response: {
        code: 'ORDER_STATE_CONFLICT',
      },
    });
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
  });

  describe('getAllOrders with filters', () => {
    it('filters orders by status, externalOrderId, and channelAccountId', async () => {
      const dataSource = {
        query: jest.fn().mockResolvedValue([createOrderRow()]),
      };
      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      await service.getAllOrders('tenant_schema', {
        status: 'CONFIRMED',
        externalOrderId: 'EXT-123',
        channelAccountId: '33333333-3333-3333-3333-333333333333',
      });

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringMatching(
          /WHERE status = \$1 AND external_order_id = \$2 AND channel_account_id = \$3/,
        ),
        ['CONFIRMED', 'EXT-123', '33333333-3333-3333-3333-333333333333'],
      );
    });

    it('filters orders by single parameter status', async () => {
      const dataSource = {
        query: jest.fn().mockResolvedValue([createOrderRow()]),
      };
      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      await service.getAllOrders('tenant_schema', {
        status: 'SHIPPED',
      });

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringMatching(/WHERE status = \$1/),
        ['SHIPPED'],
      );
    });

    it('filters orders by customerId', async () => {
      const dataSource = {
        query: jest.fn().mockResolvedValue([createOrderRow()]),
      };
      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      await service.getAllOrders('tenant_schema', {
        customerId: '11111111-2222-3333-4444-555555555555',
      });

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringMatching(/WHERE customer_id = \$1/),
        ['11111111-2222-3333-4444-555555555555'],
      );
    });

    it('returns paginated response with metadata when page or limit is provided', async () => {
      const dataSource = {
        query: jest
          .fn()
          .mockResolvedValueOnce([{ count: 42 }]) // count query
          .mockResolvedValueOnce([createOrderRow(), createOrderRow()]), // data query
      };
      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      const result = await service.getAllOrders('tenant_schema', {
        page: 2,
        limit: 10,
      });

      expect('meta' in result).toBe(true);
      if ('meta' in result) {
        expect(result.meta.page).toBe(2);
        expect(result.meta.limit).toBe(10);
        expect(result.meta.total).toBe(42);
        expect(result.meta.totalPages).toBe(5);
        expect(result.meta.hasNextPage).toBe(true);
        expect(result.meta.hasPrevPage).toBe(true);
        expect(result.data).toHaveLength(2);
      }

      // Verify count query
      expect(dataSource.query).toHaveBeenNthCalledWith(
        1,
        'SELECT COUNT(*)::int AS count FROM "tenant_schema".orders',
        [],
      );
      // Verify paginated data query with LIMIT and OFFSET
      expect(dataSource.query).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/LIMIT \$1 OFFSET \$2/),
        [10, 10],
      );
    });

    it('filters orders by text search q across orderNumber, externalOrderId, and customerName', async () => {
      const dataSource = {
        query: jest.fn().mockResolvedValue([createOrderRow()]),
      };
      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      await service.getAllOrders('tenant_schema', {
        q: 'Nguyen',
      });

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringMatching(/order_number ILIKE \$1 OR external_order_id ILIKE \$1 OR customer_name ILIKE \$1/),
        ['%Nguyen%'],
      );
    });

    it('filters orders by date range from and to', async () => {
      const dataSource = {
        query: jest.fn().mockResolvedValue([createOrderRow()]),
      };
      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      await service.getAllOrders('tenant_schema', {
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T23:59:59.999Z',
      });

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringMatching(/created_at >= \$1 AND created_at <= \$2/),
        [new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-31T23:59:59.999Z')],
      );
    });

    it('supports custom sorting', async () => {
      const dataSource = {
        query: jest.fn().mockResolvedValue([createOrderRow()]),
      };
      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      await service.getAllOrders('tenant_schema', {
        sort: 'totalAmount:asc',
      });

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringMatching(/ORDER BY total_amount ASC/),
        [],
      );
    });
  });

  describe('getOrderById allowedTransitions (S2.1.4)', () => {
    it.each([
      ['PENDING', ['CONFIRMED', 'CANCELLED']],
      ['CONFIRMED', ['PROCESSING', 'CANCELLED']],
      ['PROCESSING', ['SHIPPED', 'CANCELLED']],
      ['SHIPPED', ['DELIVERED']],
      ['DELIVERED', []],
      ['CANCELLED', []],
    ])('returns valid allowedTransitions for %s status', async (status, expectedTransitions) => {
      const dataSource = {
        query: jest.fn().mockResolvedValue([createOrderRow({ status })]),
      };
      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      const order = await service.getOrderById('order-1', 'tenant_schema');
      expect(order.allowedTransitions).toEqual(expectedTransitions);
    });
  });

  describe('getOrderTimeline (S2.1.3)', () => {
    it('throws NotFoundException when order does not exist', async () => {
      const dataSource = {
        query: jest.fn().mockResolvedValue([]),
      };
      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      await expect(
        service.getOrderTimeline('non-existent-id', 'tenant_schema'),
      ).rejects.toThrow('Order not found');
    });

    it('merges audit logs and inventory movements in chronological order', async () => {
      const orderRow = createOrderRow({ id: 'order-1' });
      const auditLog = {
        id: 'audit-1',
        user_id: 'user-1',
        action: 'ORDER_CREATED',
        changes: JSON.stringify({ totalAmount: 100 }),
        created_at: new Date('2026-01-01T10:00:00.000Z'),
      };
      const inventoryMovement = {
        id: 'inv-mov-1',
        movement_type: 'RESERVE',
        quantity_delta: 0,
        reserved_delta: 2,
        actor_user_id: 'user-1',
        sku: 'SKU-001',
        created_at: new Date('2026-01-01T10:00:05.000Z'),
      };
      const auditLogUpdate = {
        id: 'audit-2',
        user_id: 'user-2',
        action: 'ORDER_STATUS_CHANGED',
        changes: JSON.stringify({ from: 'PENDING', to: 'CONFIRMED' }),
        created_at: new Date('2026-01-01T10:30:00.000Z'),
      };

      const dataSource = {
        query: jest
          .fn()
          .mockResolvedValueOnce([orderRow]) // getOrderById
          .mockResolvedValueOnce([auditLogUpdate, auditLog]) // audit_logs (unordered or raw)
          .mockResolvedValueOnce([inventoryMovement]), // inventory_movements
      };

      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      const timeline = await service.getOrderTimeline('order-1', 'tenant_schema');

      expect(timeline).toHaveLength(3);
      // Chronological order verification
      expect(timeline[0].id).toBe('audit-1');
      expect(timeline[0].type).toBe('AUDIT');
      expect(timeline[0].event).toBe('ORDER_CREATED');

      expect(timeline[1].id).toBe('inv-mov-1');
      expect(timeline[1].type).toBe('INVENTORY');
      expect(timeline[1].event).toBe('RESERVE');

      expect(timeline[2].id).toBe('audit-2');
      expect(timeline[2].type).toBe('AUDIT');
      expect(timeline[2].event).toBe('ORDER_STATUS_CHANGED');
    });
  });

  describe('bulkUpdateOrderStatus (S2.1.5)', () => {
    it('processes batch with isolated transactions: 8 succeed and 2 fail with domain conflict codes', async () => {
      const dataSource = {
        query: jest.fn().mockResolvedValue([]), // No existing idempotency record, insert succeeds
      };
      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      const orderIds = Array.from({ length: 10 }, (_, i) => `order-${i + 1}`);

      // Spy on updateOrderStatus to simulate 8 valid orders and 2 conflicting orders
      jest.spyOn(service, 'updateOrderStatus').mockImplementation(async (id) => {
        if (id === 'order-3' || id === 'order-7') {
          const error: any = new Error(`Cannot transition order ${id}`);
          error.response = {
            code: 'ORDER_STATE_CONFLICT',
            message: `Cannot transition order ${id}`,
          };
          throw error;
        }
        return createOrderRow({ id, status: 'CONFIRMED' }) as any;
      });

      const result = await service.bulkUpdateOrderStatus(
        {
          ids: orderIds,
          status: 'CONFIRMED',
        },
        'user-1',
        'tenant_schema',
      );

      expect(result.total).toBe(10);
      expect(result.successCount).toBe(8);
      expect(result.failureCount).toBe(2);
      expect(result.succeeded).toHaveLength(8);
      expect(result.failed).toEqual([
        {
          id: 'order-3',
          code: 'ORDER_STATE_CONFLICT',
          message: 'Cannot transition order order-3',
        },
        {
          id: 'order-7',
          code: 'ORDER_STATE_CONFLICT',
          message: 'Cannot transition order order-7',
        },
      ]);
    });

    it('returns cached idempotent result when called with existing idempotencyKey', async () => {
      const cachedResult = {
        succeeded: ['order-1', 'order-2'],
        failed: [],
        total: 2,
        successCount: 2,
        failureCount: 0,
      };

      const dataSource = {
        query: jest.fn().mockResolvedValueOnce([
          {
            changes: JSON.stringify({
              idempotencyKey: 'idemp-key-1',
              result: cachedResult,
            }),
          },
        ]),
      };

      const service = new OrdersService(
        dataSource as unknown as DataSource,
        createInventoryServiceMock() as unknown as InventoryService,
      );

      const updateSpy = jest.spyOn(service, 'updateOrderStatus');

      const result = await service.bulkUpdateOrderStatus(
        {
          ids: ['order-1', 'order-2'],
          status: 'CONFIRMED',
          idempotencyKey: 'idemp-key-1',
        },
        'user-1',
        'tenant_schema',
        'idemp-key-1',
      );

      expect(result).toEqual(cachedResult);
      // No order status updates re-triggered
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});

