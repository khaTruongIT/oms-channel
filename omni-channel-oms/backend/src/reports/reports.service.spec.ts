import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';

describe('ReportsService (S5.1.4)', () => {
  let service: ReportsService;
  let mockDataSource: { query: jest.Mock };

  beforeEach(() => {
    mockDataSource = {
      query: jest.fn(),
    };
    service = new ReportsService(mockDataSource as unknown as DataSource);
    service.clearCache();
  });

  describe('Validation & Date Range', () => {
    it('throws BadRequestException if date format is invalid', async () => {
      await expect(
        service.getSalesReport(
          { from: 'invalid-date', to: '2026-01-31' },
          'tenant_test',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if from date is after to date', async () => {
      await expect(
        service.getSalesReport(
          { from: '2026-02-01', to: '2026-01-01' },
          'tenant_test',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if date range exceeds 366 days', async () => {
      await expect(
        service.getSalesReport(
          { from: '2024-01-01', to: '2025-02-01' }, // > 366 days
          'tenant_test',
        ),
      ).rejects.toThrow(/vượt quá 366 ngày/);
    });
  });

  describe('getSalesReport', () => {
    it('returns daily sales aggregation and caches result for subsequent calls', async () => {
      mockDataSource.query.mockResolvedValueOnce([
        { period: '2026-01-01', orders: '5', sales: '1200000' },
        { period: '2026-01-02', orders: '8', sales: '2400000' },
      ]);

      const res1 = await service.getSalesReport(
        { from: '2026-01-01', to: '2026-01-07', groupBy: 'day' },
        'tenant_test',
      );

      expect(res1).toHaveLength(2);
      expect(res1[0]).toEqual({
        period: '2026-01-01',
        orders: 5,
        sales: 1200000,
      });

      // Second call should hit memory cache (no database query)
      const res2 = await service.getSalesReport(
        { from: '2026-01-01', to: '2026-01-07', groupBy: 'day' },
        'tenant_test',
      );
      expect(res2).toEqual(res1);
      expect(mockDataSource.query).toHaveBeenCalledTimes(1);
    });

    it('returns channel sales aggregation', async () => {
      mockDataSource.query.mockResolvedValueOnce([
        { channel: 'SHOPEE', orders: '12', sales: '3500000' },
        { channel: 'TIKTOK', orders: '8', sales: '1900000' },
      ]);

      const res = await service.getSalesReport(
        { from: '2026-01-01', to: '2026-01-07', groupBy: 'channel' },
        'tenant_test',
      );

      expect(res).toHaveLength(2);
      expect(res[0]).toEqual({
        channel: 'SHOPEE',
        orders: 12,
        sales: 3500000,
      });
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY channel'),
        expect.any(Array),
      );
    });
  });

  describe('getInventoryValueReport', () => {
    it('aggregates inventory value by category and computes summary', async () => {
      mockDataSource.query.mockResolvedValueOnce([
        {
          category_name: 'Thời trang',
          sku_count: '15',
          total_quantity: '100',
          total_reserved: '20',
          total_valuation: '15000000',
          low_stock_count: '2',
        },
        {
          category_name: 'Phụ kiện',
          sku_count: '8',
          total_quantity: '50',
          total_reserved: '5',
          total_valuation: '5000000',
          low_stock_count: '1',
        },
      ]);

      const res = await service.getInventoryValueReport('tenant_test');

      expect(res.categories).toHaveLength(2);
      expect(res.categories[0]).toEqual({
        category: 'Thời trang',
        skuCount: 15,
        available: 80,
        reserved: 20,
        lowStock: 2,
        valuation: 15000000,
      });

      expect(res.summary).toEqual({
        totalQuantity: 150,
        totalReserved: 25,
        totalValuation: 20000000,
        totalSkus: 23,
        lowStockCount: 3,
      });
    });
  });

  describe('getTopSkusReport', () => {
    it('aggregates top SKUs by revenue within date range', async () => {
      mockDataSource.query.mockResolvedValueOnce([
        {
          master_sku_id: 'sku-1',
          sku_code: 'AT-001',
          product_name: 'Áo thun basic',
          units_sold: '45',
          revenue: '4500000',
        },
      ]);

      const res = await service.getTopSkusReport(
        { from: '2026-01-01', to: '2026-01-31', limit: 5 },
        'tenant_test',
      );

      expect(res).toHaveLength(1);
      expect(res[0]).toEqual({
        masterSkuId: 'sku-1',
        sku: 'AT-001',
        productName: 'Áo thun basic',
        unitsSold: 45,
        revenue: 4500000,
      });
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $3'),
        expect.arrayContaining([5]),
      );
    });
  });
});
