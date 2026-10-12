import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryService } from './inventory.service';
import { ErrorCode } from '../common/errors/error-codes';

interface Queryable {
  query: jest.MockedFunction<QueryFn>;
}

type QueryFn = (query: string, parameters?: unknown[]) => Promise<unknown[]>;

function createInventoryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inventory-1',
    master_sku_id: 'sku-1',
    warehouse_id: 'warehouse-1',
    quantity: 10,
    reserved_quantity: 2,
    safety_stock: 1,
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    sku_code: 'SKU-001',
    product_name: 'Test Product',
    warehouse_name: 'Central Warehouse',
    ...overrides,
  };
}

describe('InventoryService reserveStock', () => {
  let queryable: Queryable;
  let service: InventoryService;

  beforeEach(() => {
    queryable = {
      query: jest.fn<QueryFn>(),
    };

    service = new InventoryService(queryable as unknown as DataSource);
  });

  it('uses a single atomic conditional update to reserve stock', async () => {
    queryable.query.mockResolvedValue([
      createInventoryRow({ reserved_quantity: 5 }),
    ]);

    await service.reserveStock(
      {
        masterSkuId: 'sku-1',
        warehouseId: 'warehouse-1',
        quantity: 3,
      },
      'tenant_schema',
    );

    const [sql, params] = queryable.query.mock.calls[0];
    expect(sql).toContain('UPDATE "tenant_schema".inventory');
    expect(sql).toContain('quantity - reserved_quantity - safety_stock >= $1');
    expect(params).toEqual([3, 'sku-1', 'warehouse-1']);
    expect(queryable.query).toHaveBeenCalledTimes(1);
  });

  it('rejects insufficient stock after a failed conditional update', async () => {
    queryable.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        createInventoryRow({ quantity: 4, reserved_quantity: 2, safety_stock: 0 }),
      ]);

    await expect(
      service.reserveStock(
        {
          masterSkuId: 'sku-1',
          warehouseId: 'warehouse-1',
          quantity: 3,
        },
        'tenant_schema',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('handles 20 concurrent reserve requests for 10 units safely (S2.2.8)', async () => {
    let availableUnits = 10;
    const mockQuery = jest.fn(async (sql: string, params?: any[]) => {
      if (sql.includes('UPDATE "tenant_schema".inventory')) {
        const qty = params?.[0] as number;
        if (availableUnits >= qty) {
          availableUnits -= qty;
          return [createInventoryRow({ quantity: 10, reserved_quantity: 10 - availableUnits })];
        }
        return [];
      }
      if (sql.includes('SELECT quantity')) {
        return [createInventoryRow({ quantity: 10, reserved_quantity: 10 - availableUnits })];
      }
      return [];
    });

    const concurrentService = new InventoryService({ query: mockQuery } as unknown as DataSource);

    const requests = Array.from({ length: 20 }, (_, idx) =>
      concurrentService
        .reserveStock(
          {
            masterSkuId: 'sku-1',
            warehouseId: 'warehouse-1',
            quantity: 1,
          },
          'tenant_schema',
        )
        .then(() => ({ success: true, idx }))
        .catch((err) => ({ success: false, err, idx })),
    );

    const results = await Promise.all(requests);
    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    expect(succeeded).toHaveLength(10);
    expect(failed).toHaveLength(10);
    expect(availableUnits).toBe(0);
  });
});

describe('InventoryService getInventory & ATS (S2.2.1)', () => {
  let queryable: Queryable;
  let service: InventoryService;

  beforeEach(() => {
    queryable = { query: jest.fn<QueryFn>() };
    service = new InventoryService(queryable as unknown as DataSource);
  });

  it('calculates ATS correctly: max(0, on_hand - reserved - safety_stock)', async () => {
    queryable.query.mockResolvedValueOnce([
      createInventoryRow({ quantity: 20, reserved_quantity: 5, safety_stock: 3 }),
      createInventoryRow({ quantity: 10, reserved_quantity: 8, safety_stock: 5 }), // ATS would be -3 -> 0
    ]);

    const result = await service.getInventory({}, 'tenant_schema');

    expect(Array.isArray(result)).toBe(true);
    const items = result as any[];
    expect(items).toHaveLength(2);
    expect(items[0].ats).toBe(12); // 20 - 5 - 3 = 12
    expect(items[0].availableQuantity).toBe(12);
    expect(items[1].ats).toBe(0); // max(0, 10 - 8 - 5) = 0
  });

  it('returns enveloped pagination when page/limit provided (D4 transition)', async () => {
    queryable.query
      .mockResolvedValueOnce([{ count: '1' }]) // count query
      .mockResolvedValueOnce([createInventoryRow()]); // data query

    const res = await service.getInventory({ page: 1, limit: 10 }, 'tenant_schema');

    expect('meta' in res).toBe(true);
    const paginated = res as any;
    expect(paginated.meta.total).toBe(1);
    expect(paginated.meta.page).toBe(1);
    expect(paginated.data).toHaveLength(1);
  });
});

describe('InventoryService getMovements (S2.2.2)', () => {
  let queryable: Queryable;
  let service: InventoryService;

  beforeEach(() => {
    queryable = { query: jest.fn<QueryFn>() };
    service = new InventoryService(queryable as unknown as DataSource);
  });

  it('queries movements ledger with filters and pagination', async () => {
    queryable.query
      .mockResolvedValueOnce([{ count: '1' }])
      .mockResolvedValueOnce([
        {
          id: 'mov-1',
          inventory_id: 'inv-1',
          master_sku_id: 'sku-1',
          warehouse_id: 'wh-1',
          movement_type: 'TRANSFER_IN',
          quantity_delta: 5,
          reserved_delta: 0,
          idempotency_key: 'idem-1',
          actor_user_id: 'user-1',
          metadata: { note: 'restock' },
          created_at: new Date(),
          sku_code: 'SKU-001',
          product_name: 'Test Product',
          warehouse_name: 'Warehouse A',
        },
      ]);

    const res = await service.getMovements(
      { masterSkuId: 'sku-1', page: 1, limit: 10 },
      'tenant_schema',
    );

    expect('meta' in res).toBe(true);
    const paginated = res as any;
    expect(paginated.data[0].movementType).toBe('TRANSFER_IN');
    expect(paginated.data[0].quantityDelta).toBe(5);
  });
});

describe('InventoryService transferStock (S2.2.3 & S2.2.6)', () => {
  it('throws BadRequestException if source and destination are the same warehouse', async () => {
    const service = new InventoryService({} as unknown as DataSource);

    await expect(
      service.transferStock(
        {
          fromWarehouseId: 'wh-1',
          toWarehouseId: 'wh-1',
          masterSkuId: 'sku-1',
          quantity: 5,
        },
        'user-1',
        'tenant_schema',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException if destination warehouse is inactive', async () => {
    const query = jest
      .fn<QueryFn>()
      .mockResolvedValueOnce([]) // idempotency check
      .mockResolvedValueOnce([{ id: 'wh-2', is_active: false }]); // dest warehouse inactive

    const queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query,
    };

    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;

    const service = new InventoryService(dataSource);

    await expect(
      service.transferStock(
        {
          fromWarehouseId: 'wh-1',
          toWarehouseId: 'wh-2',
          masterSkuId: 'sku-1',
          quantity: 5,
        },
        'user-1',
        'tenant_schema',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('throws ConflictException with STOCK_INSUFFICIENT if source available stock < quantity', async () => {
    const query = jest
      .fn<QueryFn>()
      .mockResolvedValueOnce([]) // idempotency check
      .mockResolvedValueOnce([{ id: 'wh-2', is_active: true }]) // dest warehouse active
      .mockResolvedValueOnce([{ id: 'wh-1', is_active: true }]) // source warehouse active
      .mockResolvedValueOnce([]) // lock rows
      .mockResolvedValueOnce([createInventoryRow({ quantity: 5, reserved_quantity: 3 })]); // available = 2 < 5

    const queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query,
    };

    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;

    const service = new InventoryService(dataSource);

    await expect(
      service.transferStock(
        {
          fromWarehouseId: 'wh-1',
          toWarehouseId: 'wh-2',
          masterSkuId: 'sku-1',
          quantity: 5,
        },
        'user-1',
        'tenant_schema',
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ErrorCode.STOCK_INSUFFICIENT,
      }),
    });

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('locks warehouses in sorted order and creates TRANSFER_OUT and TRANSFER_IN movements', async () => {
    const query = jest
      .fn<QueryFn>()
      .mockResolvedValueOnce([]) // idempotency check
      .mockResolvedValueOnce([{ id: 'wh-b', is_active: true }]) // dest active
      .mockResolvedValueOnce([{ id: 'wh-a', is_active: true }]) // source active
      .mockResolvedValueOnce([]) // lock in sorted order
      .mockResolvedValueOnce([createInventoryRow({ id: 'inv-src', warehouse_id: 'wh-a', quantity: 20, reserved_quantity: 2 })]) // source row
      .mockResolvedValueOnce([createInventoryRow({ id: 'inv-dest', warehouse_id: 'wh-b', quantity: 5, reserved_quantity: 0 })]) // dest row
      .mockResolvedValueOnce([createInventoryRow({ quantity: 10 })]) // update source
      .mockResolvedValueOnce([createInventoryRow({ quantity: 15 })]) // update dest
      .mockResolvedValueOnce([]) // insert OUT movement
      .mockResolvedValueOnce([]) // insert IN movement
      .mockResolvedValueOnce([]); // audit log

    const queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query,
    };

    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;

    const service = new InventoryService(dataSource);

    const result = await service.transferStock(
      {
        fromWarehouseId: 'wh-a',
        toWarehouseId: 'wh-b',
        masterSkuId: 'sku-1',
        quantity: 10,
        idempotencyKey: 'tx-key-1',
      },
      'user-1',
      'tenant_schema',
    );

    // Verify sorted lock query
    expect(query.mock.calls[3][0]).toContain('ORDER BY warehouse_id ASC');
    expect(query.mock.calls[3][0]).toContain('FOR UPDATE');

    // Verify OUT movement
    expect(query.mock.calls[8][0]).toContain('inventory_movements');
    expect(query.mock.calls[8][1]).toContain('TRANSFER_OUT');
    expect(query.mock.calls[8][1]).toContain(-10);

    // Verify IN movement
    expect(query.mock.calls[9][0]).toContain('inventory_movements');
    expect(query.mock.calls[9][1]).toContain('TRANSFER_IN');
    expect(query.mock.calls[9][1]).toContain(10);

    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(result.quantity).toBe(10);
  });
});

describe('InventoryService updateSafetyStock (S2.2.5)', () => {
  it('throws BadRequestException for negative safety stock', async () => {
    const service = new InventoryService({} as unknown as DataSource);

    await expect(
      service.updateSafetyStock(
        {
          warehouseId: 'wh-1',
          masterSkuId: 'sku-1',
          safetyStock: -5,
        },
        'user-1',
        'tenant_schema',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates safety stock and logs audit', async () => {
    const query = jest
      .fn<QueryFn>()
      .mockResolvedValueOnce([{ id: 'wh-1', is_active: true }]) // warehouse check
      .mockResolvedValueOnce([{ id: 'sku-1' }]) // sku check
      .mockResolvedValueOnce([createInventoryRow()]) // existing row
      .mockResolvedValueOnce([createInventoryRow({ safety_stock: 8 })]) // updated row
      .mockResolvedValueOnce([]); // audit log

    const service = new InventoryService({ query } as unknown as DataSource);

    const item = await service.updateSafetyStock(
      {
        warehouseId: 'wh-1',
        masterSkuId: 'sku-1',
        safetyStock: 8,
      },
      'user-1',
      'tenant_schema',
    );

    expect(item.safetyStock).toBe(8);
  });
});
