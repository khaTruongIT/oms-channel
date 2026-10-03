import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryService } from './inventory.service';

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
    safety_stock: 0,
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
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
        idempotencyKey: 'reserve-1',
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
        createInventoryRow({ quantity: 4, reserved_quantity: 2 }),
      ]);

    await expect(
      service.reserveStock(
        {
          masterSkuId: 'sku-1',
          warehouseId: 'warehouse-1',
          quantity: 3,
          idempotencyKey: 'reserve-1',
        },
        'tenant_schema',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('InventoryService adjustStock', () => {
  it('records a manual adjustment and its ledger movement in one transaction', async () => {
    const query = jest
      .fn<QueryFn>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createInventoryRow()])
      .mockResolvedValueOnce([createInventoryRow({ quantity: 15 })])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
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

    await service.adjustStock(
      {
        masterSkuId: 'sku-1',
        warehouseId: 'warehouse-1',
        quantity: 5,
        reason: 'Cycle count',
        idempotencyKey: 'adjustment-1',
      },
      'user-1',
      'tenant_schema',
    );

    expect(query.mock.calls[1][0]).toContain('FOR UPDATE');
    expect(query.mock.calls[3][0]).toContain('inventory_movements');
    expect(query.mock.calls[3][1]).toContain('adjustment-1');
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });
});

describe('InventoryService reserveManualStock', () => {
  it('writes the reservation and ledger movement in one transaction', async () => {
    const query = jest
      .fn<QueryFn>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createInventoryRow({ reserved_quantity: 5 })])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
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

    await service.reserveManualStock(
      {
        masterSkuId: 'sku-1',
        warehouseId: 'warehouse-1',
        quantity: 3,
        idempotencyKey: 'manual-reserve-1',
      },
      'user-1',
      'tenant_schema',
    );

    expect(query.mock.calls[2][0]).toContain('inventory_movements');
    expect(query.mock.calls[2][1]).toContain('manual-reserve-1');
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });
});
