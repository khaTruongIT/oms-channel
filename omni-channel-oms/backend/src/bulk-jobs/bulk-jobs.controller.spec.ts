import { Test, TestingModule } from '@nestjs/testing';
import { BulkJobsController } from './bulk-jobs.controller';
import { BulkJobsService } from './bulk-jobs.service';
import { BulkJobType } from './entities/bulk-job.entity';

describe('BulkJobsController', () => {
  let controller: BulkJobsController;
  let service: jest.Mocked<BulkJobsService>;

  beforeEach(async () => {
    service = {
      createJob: jest.fn(),
      getJob: jest.fn(),
      getJobErrorsCsv: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkJobsController],
      providers: [{ provide: BulkJobsService, useValue: service }],
    }).compile();

    controller = module.get<BulkJobsController>(BulkJobsController);
  });

  it('should delegate createJob to service with tenant schema and user id', async () => {
    const mockReq = {
      tenantSchema: 'tenant_test',
      user: { userId: 'user-123' },
    };
    const dto = {
      type: BulkJobType.PRODUCT_IMPORT,
      rows: [{ sku: 'SKU-1', name: 'Item 1' }],
    };

    service.createJob.mockResolvedValueOnce({ id: 'job-1' } as any);

    const result = await controller.createJob(mockReq, dto);
    expect(service.createJob).toHaveBeenCalledWith(dto, 'tenant_test', 'user-123');
    expect(result).toEqual({ id: 'job-1' });
  });

  it('should delegate getJob to service with tenant schema', async () => {
    const mockReq = { tenantSchema: 'tenant_test' };
    service.getJob.mockResolvedValueOnce({ id: 'job-1', status: 'COMPLETED' } as any);

    const result = await controller.getJob(mockReq, 'job-1');
    expect(service.getJob).toHaveBeenCalledWith('job-1', 'tenant_test');
    expect(result).toEqual({ id: 'job-1', status: 'COMPLETED' });
  });

  it('should set headers and send CSV in downloadErrorsCsv', async () => {
    const mockReq = { tenantSchema: 'tenant_test' };
    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as any;

    const csvData = '\uFEFFDòng,SKU,Trường,Chi tiết lỗi\n1,"SKU-1","price","Giá âm"';
    service.getJobErrorsCsv.mockResolvedValueOnce(csvData);

    await controller.downloadErrorsCsv(mockReq, mockRes, 'job-uuid-123');

    expect(service.getJobErrorsCsv).toHaveBeenCalledWith('job-uuid-123', 'tenant_test');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="bulk-job-job-uuid-123-errors.csv"',
    );
    expect(mockRes.send).toHaveBeenCalledWith(csvData);
  });
});
