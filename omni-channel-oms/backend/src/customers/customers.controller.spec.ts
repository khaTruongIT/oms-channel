import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: jest.Mocked<CustomersService>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [{ provide: CustomersService, useValue: service }],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  it('should delegate getCustomers to service with tenant schema', async () => {
    const mockReq = { tenantSchema: 'tenant_schema1' };
    const query = { page: 1, limit: 20 };
    service.findAll.mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await controller.getCustomers(mockReq, query);
    expect(service.findAll).toHaveBeenCalledWith(query, 'tenant_schema1');
    expect(res.total).toBe(0);
  });

  it('should delegate getCustomer by id to service', async () => {
    const mockReq = { tenantSchema: 'tenant_schema1' };
    service.findOne.mockResolvedValueOnce({
      id: 'cust-uuid-1',
      fullName: 'Customer A',
      phone: '0901234567',
      totalOrders: 1,
      totalSpent: 100,
      createdAt: new Date(),
      recentOrders: [],
    });

    const res = await controller.getCustomer(mockReq, 'cust-uuid-1');
    expect(service.findOne).toHaveBeenCalledWith('cust-uuid-1', 'tenant_schema1');
    expect(res.id).toBe('cust-uuid-1');
  });
});
