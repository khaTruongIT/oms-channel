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
      .mockResolvedValueOnce([createOrderRow()])
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
      { status: 'CANCELLED' },
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
      { status: 'CANCELLED' },
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
});
