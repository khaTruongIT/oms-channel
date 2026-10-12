import { Test, TestingModule } from '@nestjs/testing';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { TenantLimitsService } from '../tenants/tenant-limits.service';

describe('WarehousesController', () => {
  let controller: WarehousesController;
  let warehousesService: jest.Mocked<Partial<WarehousesService>>;
  let tenantLimitsService: jest.Mocked<Partial<TenantLimitsService>>;

  const mockReq = {
    user: {
      userId: '11111111-1111-1111-1111-111111111111',
      tenantId: '22222222-2222-2222-2222-222222222222',
      schemaName: 'tenant_test',
      role: 'OWNER',
    },
  };

  beforeEach(async () => {
    warehousesService = {
      createWarehouse: jest.fn(),
      getAllWarehouses: jest.fn(),
      getWarehouseById: jest.fn(),
      updateWarehouse: jest.fn(),
      deleteWarehouse: jest.fn(),
    };

    tenantLimitsService = {
      enforceWarehouseLimit: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehousesController],
      providers: [
        { provide: WarehousesService, useValue: warehousesService },
        { provide: TenantLimitsService, useValue: tenantLimitsService },
      ],
    }).compile();

    controller = module.get<WarehousesController>(WarehousesController);
  });

  it('delegates updateWarehouse to service', async () => {
    const warehouseId = '11111111-1111-1111-1111-111111111111';
    const dto = { name: 'Updated' };
    warehousesService.updateWarehouse!.mockResolvedValue({
      id: warehouseId,
      name: 'Updated',
      location: 'Loc',
      isActive: true,
    });

    const res = await controller.updateWarehouse(mockReq, warehouseId, dto);
    expect(res.name).toBe('Updated');
    expect(warehousesService.updateWarehouse).toHaveBeenCalledWith(
      warehouseId,
      dto,
      'tenant_test',
    );
  });

  it('delegates deleteWarehouse to service', async () => {
    const warehouseId = '11111111-1111-1111-1111-111111111111';
    warehousesService.deleteWarehouse!.mockResolvedValue({
      id: warehouseId,
      name: 'Deleted',
      location: 'Loc',
      isActive: false,
    });

    const res = await controller.deleteWarehouse(mockReq, warehouseId);
    expect(res.isActive).toBe(false);
    expect(warehousesService.deleteWarehouse).toHaveBeenCalledWith(
      warehouseId,
      'tenant_test',
    );
  });
});
