import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WarehousesService } from './warehouses.service';
import { ErrorCode } from '../common/errors/error-codes';

type DataSourceMock = Pick<DataSource, 'query'>;

function createDataSourceMock(): jest.Mocked<DataSourceMock> {
  return {
    query: jest.fn(),
  };
}

describe('WarehousesService', () => {
  let service: WarehousesService;
  let dataSource: jest.Mocked<DataSourceMock>;
  const schemaName = 'tenant_test';
  const warehouseId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    dataSource = createDataSourceMock();
    service = new WarehousesService(dataSource as unknown as DataSource);
  });

  describe('updateWarehouse', () => {
    it('throws NotFoundException when warehouse does not exist', async () => {
      dataSource.query.mockResolvedValueOnce([]); // existence check

      await expect(
        service.updateWarehouse(
          warehouseId,
          { name: 'Updated Name' },
          schemaName,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates and returns the updated warehouse', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: warehouseId, is_active: true }]) // existence check
        .mockResolvedValueOnce([
          {
            id: warehouseId,
            name: 'Updated Name',
            location: 'New Location',
            is_active: true,
          },
        ]); // update query

      const result = await service.updateWarehouse(
        warehouseId,
        { name: 'Updated Name', location: 'New Location' },
        schemaName,
      );

      expect(result).toEqual({
        id: warehouseId,
        name: 'Updated Name',
        location: 'New Location',
        isActive: true,
      });
    });
  });

  describe('deleteWarehouse', () => {
    it('throws NotFoundException when warehouse does not exist', async () => {
      dataSource.query.mockResolvedValueOnce([]);

      await expect(
        service.deleteWarehouse(warehouseId, schemaName),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException with WAREHOUSE_IN_USE when inventory remains in warehouse', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: warehouseId, is_active: true }]) // existence check
        .mockResolvedValueOnce([{ count: '2' }]); // inventory check has rows

      await expect(
        service.deleteWarehouse(warehouseId, schemaName),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ErrorCode.WAREHOUSE_IN_USE,
        }),
      });
    });

    it('throws ConflictException with WAREHOUSE_IN_USE when active orders reference the warehouse', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: warehouseId, is_active: true }]) // existence check
        .mockResolvedValueOnce([]) // inventory check is empty
        .mockResolvedValueOnce([{ count: '1' }]); // active orders check has rows

      await expect(
        service.deleteWarehouse(warehouseId, schemaName),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ErrorCode.WAREHOUSE_IN_USE,
        }),
      });
    });

    it('soft deletes the warehouse when empty and not in active orders', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: warehouseId, is_active: true }]) // existence check
        .mockResolvedValueOnce([]) // inventory check empty
        .mockResolvedValueOnce([]) // active orders check empty
        .mockResolvedValueOnce([
          {
            id: warehouseId,
            name: 'Empty Warehouse',
            location: 'Location',
            is_active: false,
          },
        ]); // soft delete update

      const result = await service.deleteWarehouse(warehouseId, schemaName);

      expect(result).toEqual({
        id: warehouseId,
        name: 'Empty Warehouse',
        location: 'Location',
        isActive: false,
      });
    });
  });

  describe('getWarehouseSummary', () => {
    it('returns calculated metrics for a warehouse', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: warehouseId, is_active: true }]) // existence check
        .mockResolvedValueOnce([
          {
            total_skus: '15',
            total_on_hand: '120',
            total_reserved: '25',
            total_available: '95',
            total_stock_value: '5400.50',
          },
        ]); // summary aggregation

      const summary = await service.getWarehouseSummary(warehouseId, schemaName);

      expect(summary).toEqual({
        warehouseId,
        totalSkus: 15,
        totalOnHand: 120,
        totalReserved: 25,
        totalAvailable: 95,
        totalStockValue: 5400.5,
      });
    });
  });
});

