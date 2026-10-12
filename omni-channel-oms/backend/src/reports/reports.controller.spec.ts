import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController (S5.1.4)', () => {
  let controller: ReportsController;
  let mockReportsService: {
    getSalesReport: jest.Mock;
    getInventoryValueReport: jest.Mock;
    getTopSkusReport: jest.Mock;
  };

  beforeEach(() => {
    mockReportsService = {
      getSalesReport: jest.fn(),
      getInventoryValueReport: jest.fn(),
      getTopSkusReport: jest.fn(),
    };
    controller = new ReportsController(
      mockReportsService as unknown as ReportsService,
    );
  });

  it('delegates getSalesReport to service using tenantSchema', async () => {
    mockReportsService.getSalesReport.mockResolvedValueOnce([
      { period: '2026-01-01', orders: 1, sales: 100000 },
    ]);

    const req = { tenantSchema: 'tenant_test' };
    const result = await controller.getSalesReport(req, {
      from: '2026-01-01',
      to: '2026-01-07',
    });

    expect(mockReportsService.getSalesReport).toHaveBeenCalledWith(
      { from: '2026-01-01', to: '2026-01-07' },
      'tenant_test',
    );
    expect(result).toHaveLength(1);
  });

  it('delegates getInventoryValueReport to service using tenantSchema', async () => {
    mockReportsService.getInventoryValueReport.mockResolvedValueOnce({
      categories: [],
      summary: { totalValuation: 0 },
    });

    const req = { tenantSchema: 'tenant_test' };
    const result = await controller.getInventoryValueReport(req);

    expect(mockReportsService.getInventoryValueReport).toHaveBeenCalledWith(
      'tenant_test',
    );
    expect(result.summary.totalValuation).toBe(0);
  });

  it('delegates getTopSkusReport to service using tenantSchema', async () => {
    mockReportsService.getTopSkusReport.mockResolvedValueOnce([]);

    const req = { tenantSchema: 'tenant_test' };
    await controller.getTopSkusReport(req, {
      from: '2026-01-01',
      to: '2026-01-07',
      limit: 10,
    });

    expect(mockReportsService.getTopSkusReport).toHaveBeenCalledWith(
      { from: '2026-01-01', to: '2026-01-07', limit: 10 },
      'tenant_test',
    );
  });
});
