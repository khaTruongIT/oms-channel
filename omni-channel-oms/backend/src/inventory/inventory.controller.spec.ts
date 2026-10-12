import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

describe('InventoryController', () => {
  let controller: InventoryController;
  let inventoryService: Partial<jest.Mocked<InventoryService>>;

  const mockRequest = {
    user: {
      userId: 'user-1',
      tenantId: 'tenant-1',
      schemaName: 'tenant_schema',
      email: 'user@example.com',
      role: 'owner',
    },
  } as unknown as AuthenticatedRequest;

  beforeEach(() => {
    inventoryService = {
      getInventory: jest.fn().mockResolvedValue([]),
      getMovements: jest.fn().mockResolvedValue([]),
      transferStock: jest.fn().mockResolvedValue({} as any),
      updateSafetyStock: jest.fn().mockResolvedValue({} as any),
      adjustStock: jest.fn().mockResolvedValue({} as any),
      reserveManualStock: jest.fn().mockResolvedValue({} as any),
    };

    controller = new InventoryController(inventoryService as unknown as InventoryService);
  });

  it('delegates getInventory to service with query and schema', async () => {
    const query = { page: 1, limit: 10, lowStock: true };
    await controller.getInventory(mockRequest, query);

    expect(inventoryService.getInventory).toHaveBeenCalledWith(query, 'tenant_schema');
  });

  it('delegates getMovements to service with query and schema', async () => {
    const query = { masterSkuId: 'sku-1', page: 1, limit: 20 };
    await controller.getMovements(mockRequest, query);

    expect(inventoryService.getMovements).toHaveBeenCalledWith(query, 'tenant_schema');
  });

  it('delegates transferStock to service with userId and schema', async () => {
    const dto = {
      fromWarehouseId: 'wh-1',
      toWarehouseId: 'wh-2',
      masterSkuId: 'sku-1',
      quantity: 5,
    };
    await controller.transferStock(mockRequest, dto);

    expect(inventoryService.transferStock).toHaveBeenCalledWith(dto, 'user-1', 'tenant_schema');
  });

  it('delegates updateSafetyStock to service with userId and schema', async () => {
    const dto = {
      warehouseId: 'wh-1',
      masterSkuId: 'sku-1',
      safetyStock: 10,
    };
    await controller.updateSafetyStock(mockRequest, dto);

    expect(inventoryService.updateSafetyStock).toHaveBeenCalledWith(dto, 'user-1', 'tenant_schema');
  });
});
