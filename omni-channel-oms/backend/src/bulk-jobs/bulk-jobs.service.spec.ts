import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner } from 'typeorm';
import { BadRequestException, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { BulkJobsService } from './bulk-jobs.service';
import { BulkJobType, BulkJobStatus } from './entities/bulk-job.entity';
import { TenantLimitsService } from '../tenants/tenant-limits.service';

describe('BulkJobsService', () => {
  let service: BulkJobsService;
  let dataSource: jest.Mocked<DataSource>;
  let tenantLimitsService: jest.Mocked<TenantLimitsService>;
  let mockQueryRunner: Partial<QueryRunner>;

  const mockSchema = 'tenant_tenant1';

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
    };

    dataSource = {
      query: jest.fn().mockResolvedValue([]),
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any;

    tenantLimitsService = {
      getLimitsForPlan: jest.fn().mockReturnValue({
        products: 100,
        channels: 3,
        warehouses: 2,
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkJobsService,
        { provide: DataSource, useValue: dataSource },
        { provide: TenantLimitsService, useValue: tenantLimitsService },
      ],
    }).compile();

    service = module.get<BulkJobsService>(BulkJobsService);
  });

  describe('validateRows', () => {
    it('should validate valid PRODUCT_IMPORT rows', async () => {
      const rows = [
        { sku: 'SKU-001', name: 'Product 1', price: 100000 },
        { sku: 'SKU-002', name: 'Product 2', price: 0 },
      ];

      const res = await service.validateRows(BulkJobType.PRODUCT_IMPORT, rows, mockSchema);
      expect(res.valid).toBe(true);
      expect(res.summary.total).toBe(2);
      expect(res.summary.validCount).toBe(2);
      expect(res.summary.invalidCount).toBe(0);
      expect(res.errors).toHaveLength(0);
    });

    it('should detect errors in PRODUCT_IMPORT rows (missing SKU, name, negative price)', async () => {
      const rows = [
        { sku: '', name: 'Product 1' },
        { sku: 'SKU-002', name: '' },
        { sku: 'SKU-003', name: 'Product 3', price: -50 },
      ];

      const res = await service.validateRows(BulkJobType.PRODUCT_IMPORT, rows, mockSchema);
      expect(res.valid).toBe(false);
      expect(res.summary.invalidCount).toBe(3);
      expect(res.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('should validate INVENTORY_IMPORT and check warehouse existence', async () => {
      (mockQueryRunner.query as jest.Mock).mockResolvedValueOnce([
        { id: 'wh-1', name: 'Kho Hà Nội' },
      ]);

      const rows = [
        { sku: 'SKU-001', warehouse: 'wh-1', quantity: 10 },
        { sku: 'SKU-002', warehouse: 'Kho Nonexistent', quantity: 5 },
      ];

      const res = await service.validateRows(BulkJobType.INVENTORY_IMPORT, rows, mockSchema);
      expect(res.valid).toBe(false);
      expect(res.summary.validCount).toBe(1);
      expect(res.summary.invalidCount).toBe(1);
      expect(res.errors[0].field).toBe('warehouse');
    });

    it('should block PRODUCT_DELETE if SKU has reserved_quantity > 0', async () => {
      (mockQueryRunner.query as jest.Mock).mockResolvedValueOnce([
        { sku_code: 'SKU-RESERVED', total_reserved: 5 },
        { sku_code: 'SKU-FREE', total_reserved: 0 },
      ]);

      const rows = [
        { sku: 'SKU-RESERVED' },
        { sku: 'SKU-FREE' },
      ];

      const res = await service.validateRows(BulkJobType.PRODUCT_DELETE, rows, mockSchema);
      expect(res.valid).toBe(false);
      expect(res.summary.invalidCount).toBe(1);
      expect(res.errors[0].sku).toBe('SKU-RESERVED');
      expect(res.errors[0].message).toContain('reserved');
    });
  });

  describe('createJob', () => {
    it('should reject payload exceeding 5MB', async () => {
      // Build a fake row with very large string
      const hugeRow = { sku: 'A'.repeat(5.5 * 1024 * 1024), name: 'Large' };
      await expect(
        service.createJob(
          { type: BulkJobType.PRODUCT_IMPORT, rows: [hugeRow] },
          mockSchema,
        ),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('should execute dryRun without database insert', async () => {
      const res = await service.createJob(
        {
          type: BulkJobType.PRODUCT_IMPORT,
          rows: [{ sku: 'SKU-1', name: 'Valid' }],
          dryRun: true,
        },
        mockSchema,
      );

      expect(res.dryRun).toBe(true);
      expect(res.valid).toBe(true);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
      ); // cleanupStuckJobs called
      // No INSERT into bulk_jobs
      expect(dataSource.query).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO "tenant_tenant1".bulk_jobs'),
        expect.anything(),
      );
    });

    it('should return existing job if idempotencyKey matches', async () => {
      const existingJob = {
        id: 'job-existing-1',
        type: BulkJobType.PRODUCT_IMPORT,
        status: BulkJobStatus.COMPLETED,
        total: 10,
        processed: 10,
        failed: 0,
        error_report: [],
        started_at: new Date(),
        completed_at: new Date(),
      };

      dataSource.query
        .mockResolvedValueOnce([]) // cleanupStuckJobs
        .mockResolvedValueOnce([existingJob]); // idempotency SELECT

      const res = await service.createJob(
        {
          type: BulkJobType.PRODUCT_IMPORT,
          rows: [{ sku: 'SKU-1', name: 'Item' }],
          idempotencyKey: 'key-123',
        },
        mockSchema,
      );

      expect(res.id).toBe('job-existing-1');
      expect(res.status).toBe(BulkJobStatus.COMPLETED);
    });

    it('should reject PRODUCT_IMPORT if exceeding tenant plan limit', async () => {
      dataSource.query
        .mockResolvedValueOnce([]) // cleanupStuckJobs
        .mockResolvedValueOnce([{ count: '95' }]) // current products count
        .mockResolvedValueOnce([{ id: 'tenant-1', plan: 'FREE' }]); // tenant

      await expect(
        service.createJob(
          {
            type: BulkJobType.PRODUCT_IMPORT,
            rows: Array.from({ length: 10 }, (_, i) => ({
              sku: `SKU-${i}`,
              name: `Prod ${i}`,
            })),
          },
          mockSchema,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process job in batches and record error report on failure', async () => {
      const mockCreatedJob = {
        id: 'job-new-1',
        type: BulkJobType.PRODUCT_IMPORT,
        status: BulkJobStatus.PROCESSING,
        total: 2,
        processed: 0,
        failed: 0,
        error_report: [],
      };

      dataSource.query
        .mockResolvedValueOnce([]) // cleanupStuckJobs
        .mockResolvedValueOnce([{ count: '10' }]) // product count
        .mockResolvedValueOnce([{ id: 'tenant-1', plan: 'PRO' }]) // tenant
        .mockResolvedValueOnce([mockCreatedJob]) // insert job
        .mockResolvedValueOnce([]) // update job completion
        .mockResolvedValueOnce([
          {
            ...mockCreatedJob,
            status: BulkJobStatus.COMPLETED,
            processed: 1,
            failed: 1,
            error_report: [{ row: 2, message: 'Thiếu SKU hoặc tên sản phẩm' }],
          },
        ]); // getJob

      const res = await service.createJob(
        {
          type: BulkJobType.PRODUCT_IMPORT,
          rows: [
            { sku: 'SKU-OK', name: 'Valid Item', price: 50000 },
            { sku: '', name: 'Missing SKU' }, // Will fail during execution
          ],
        },
        mockSchema,
        'user-1',
      );

      expect(res.id).toBe('job-new-1');
      expect(res.processed).toBe(1);
      expect(res.failed).toBe(1);
      expect(res.errorCount).toBe(1);
    });
  });

  describe('getJob & getJobErrorsCsv', () => {
    it('should throw NotFoundException if job does not exist in schema', async () => {
      dataSource.query.mockResolvedValueOnce([]);

      await expect(service.getJob('non-existent-id', mockSchema)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return job record when found', async () => {
      const job = { id: 'job-1', type: BulkJobType.PRODUCT_IMPORT, status: 'COMPLETED' };
      dataSource.query.mockResolvedValueOnce([job]);

      const res = await service.getJob('job-1', mockSchema);
      expect(res.id).toBe('job-1');
    });

    it('should export BOM UTF-8 CSV error file', async () => {
      const jobWithErrors = {
        id: 'job-1',
        error_report: [
          { row: 1, sku: 'SKU-1', field: 'price', message: 'Giá âm' },
          { row: 2, sku: 'SKU-2', field: 'name', message: 'Tên "đặc biệt" trống' },
        ],
      };
      dataSource.query.mockResolvedValueOnce([jobWithErrors]);

      const csv = await service.getJobErrorsCsv('job-1', mockSchema);
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('Dòng,SKU,Trường,Chi tiết lỗi');
      expect(csv).toContain('1,"SKU-1","price","Giá âm"');
      expect(csv).toContain('""đặc biệt""'); // Escaped quotes
    });

    it('should export entity CSV and return it via getJobExportCsv', async () => {
      const mockCreatedJob = {
        id: 'export-job-1',
        type: BulkJobType.EXPORT,
        status: BulkJobStatus.PROCESSING,
        total: 1,
        processed: 0,
        failed: 0,
        error_report: [],
      };

      dataSource.query
        .mockResolvedValueOnce([]) // cleanupStuckJobs
        .mockResolvedValueOnce([mockCreatedJob]) // insert job
        .mockResolvedValueOnce([
          {
            order_number: 'ORD-100',
            channel: 'SHOPEE',
            status: 'COMPLETED',
            total_amount: 150000,
            customer_name: 'Khách A',
            customer_phone: '0901234567',
            created_at: new Date('2026-01-01'),
          },
        ]) // query orders
        .mockResolvedValueOnce([]) // update job completion
        .mockResolvedValueOnce([
          {
            ...mockCreatedJob,
            status: BulkJobStatus.COMPLETED,
            processed: 1,
            payload: {
              csv: '\uFEFFMã đơn,Kênh,Trạng thái,Tổng tiền,Khách hàng,SĐT,Ngày tạo\n"ORD-100","SHOPEE","COMPLETED",150000,"Khách A","0901234567","2026-01-01"',
            },
          },
        ]); // getJob

      const res = await service.createJob(
        {
          type: BulkJobType.EXPORT,
          rows: [{ entity: 'orders' }],
        },
        mockSchema,
        'user-1',
      );

      expect(res.status).toBe(BulkJobStatus.COMPLETED);
      expect(res.processed).toBe(1);

      // Verify download CSV
      dataSource.query.mockResolvedValueOnce([
        {
          id: 'export-job-1',
          payload: { csv: '\uFEFFMã đơn,Kênh\n"ORD-100","SHOPEE"' },
        },
      ]);
      const csv = await service.getJobExportCsv('export-job-1', mockSchema);
      expect(csv).toContain('ORD-100');
    });
  });
});
