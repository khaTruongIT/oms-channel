import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { SearchService, escapeIlikePattern } from './search.service';

describe('SearchService (S5.1.2)', () => {
  let service: SearchService;
  let mockDataSource: { query: jest.Mock };

  beforeEach(() => {
    mockDataSource = {
      query: jest.fn(),
    };
    service = new SearchService(mockDataSource as unknown as DataSource);
  });

  describe('escapeIlikePattern', () => {
    it('escapes %, _, and backslash properly', () => {
      expect(escapeIlikePattern('simple')).toBe('simple');
      expect(escapeIlikePattern('100% cotton')).toBe('100\\% cotton');
      expect(escapeIlikePattern('user_name')).toBe('user\\_name');
      expect(escapeIlikePattern('path\\test')).toBe('path\\\\test');
    });
  });

  describe('search', () => {
    it('throws BadRequestException if query string has less than 2 characters', async () => {
      await expect(
        service.search({ q: 'a' }, 'tenant_test'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.search({ q: '   ' }, 'tenant_test'),
      ).rejects.toThrow(BadRequestException);
    });

    it('searches products, orders, and customers by default with escaped wildcard and 5-limit', async () => {
      mockDataSource.query
        // products
        .mockResolvedValueOnce([
          {
            id: 'prod-1',
            sku_code: 'SKU-001',
            product_name: 'Áo thun cotton 100%',
          },
        ])
        // orders
        .mockResolvedValueOnce([
          {
            id: 'ord-1',
            order_number: 'ORD-999',
            channel: 'SHOPEE',
            customer_name: 'Nguyễn Văn A',
            status: 'CONFIRMED',
            total_amount: 250000,
          },
        ])
        // customers
        .mockResolvedValueOnce([
          {
            id: 'cust-1',
            full_name: 'Nguyễn Văn A',
            phone: '0901234567',
            email: 'a@example.com',
            total_orders: 3,
          },
        ]);

      const result = await service.search(
        { q: '100% cotton' },
        'tenant_test',
      );

      expect(result.query).toBe('100% cotton');
      expect(result.items).toHaveLength(3);

      expect(result.items[0]).toEqual({
        id: 'prod-1',
        type: 'product',
        title: 'Áo thun cotton 100%',
        subtitle: 'SKU: SKU-001',
        url: '/products/prod-1',
      });

      expect(result.items[1]).toEqual({
        id: 'ord-1',
        type: 'order',
        title: 'Đơn hàng #ORD-999',
        subtitle: 'CONFIRMED • Nguyễn Văn A',
        url: '/orders/ord-1',
      });

      expect(result.items[2]).toEqual({
        id: 'cust-1',
        type: 'customer',
        title: 'Nguyễn Văn A',
        subtitle: '0901234567 • a@example.com (3 đơn)',
        url: '/customers/cust-1',
      });

      // Verify products query used ESCAPE '\' and escaped parameter
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining("ESCAPE '\\'"),
        ['%100\\% cotton%'],
      );
    });

    it('filters search by requested types (e.g., only products and orders)', async () => {
      mockDataSource.query
        // products
        .mockResolvedValueOnce([
          {
            id: 'prod-1',
            sku_code: 'SKU-ABC',
            product_name: 'Giày sneaker',
          },
        ])
        // orders
        .mockResolvedValueOnce([]);

      const result = await service.search(
        { q: 'sneaker', types: 'products,orders' },
        'tenant_test',
      );

      expect(mockDataSource.query).toHaveBeenCalledTimes(2);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('product');
    });
  });
});
