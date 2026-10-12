import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let dataSource: jest.Mocked<DataSource>;

  const mockSchema = 'tenant_tenant1';

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('findAll', () => {
    it('should return paginated customers list with totals', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ count: '1' }]) // count query
        .mockResolvedValueOnce([
          {
            id: 'cust-1',
            full_name: 'Trần Văn B',
            phone: '0901234567',
            raw_phone: '+84901234567',
            email: 'b@example.com',
            total_orders: 5,
            total_spent: '1250000.00',
            last_order_at: new Date('2026-10-10'),
            created_at: new Date('2026-09-01'),
          },
        ]); // items query

      const res = await service.findAll(
        { page: 1, limit: 10, sortBy: 'total_spent', sortOrder: 'DESC' },
        mockSchema,
      );

      expect(res.total).toBe(1);
      expect(res.items).toHaveLength(1);
      expect(res.items[0].fullName).toBe('Trần Văn B');
      expect(res.items[0].totalSpent).toBe(1250000);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY total_spent DESC'),
        expect.anything(),
      );
    });

    it('should apply search filter on full_name and phone', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ count: '1' }])
        .mockResolvedValueOnce([]);

      await service.findAll({ q: '090123' }, mockSchema);

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('full_name ILIKE $1 OR phone ILIKE $1'),
        expect.arrayContaining(['%090123%']),
      );
    });
  });

  describe('findOne', () => {
    it('should return customer details with recent orders', async () => {
      const mockCustomer = {
        id: 'cust-1',
        full_name: 'Lê Thị C',
        phone: '0912345678',
        total_orders: 2,
        total_spent: '300000.00',
        created_at: new Date(),
      };
      const mockOrders = [
        {
          id: 'order-1',
          order_number: 'ORD-101',
          channel: 'shopee',
          status: 'DELIVERED',
          total_amount: '150000.00',
          created_at: new Date(),
        },
      ];

      dataSource.query
        .mockResolvedValueOnce([mockCustomer])
        .mockResolvedValueOnce(mockOrders);

      const res = await service.findOne('cust-1', mockSchema);
      expect(res.id).toBe('cust-1');
      expect(res.fullName).toBe('Lê Thị C');
      expect(res.recentOrders).toHaveLength(1);
      expect(res.recentOrders[0].orderNumber).toBe('ORD-101');
    });

    it('should throw NotFoundException if customer not found', async () => {
      dataSource.query.mockResolvedValueOnce([]);

      await expect(service.findOne('non-existent', mockSchema)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
