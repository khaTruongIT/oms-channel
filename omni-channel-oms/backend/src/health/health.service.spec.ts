import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

type DataSourceMock = Pick<DataSource, 'query'>;

function createDataSourceMock(): jest.Mocked<DataSourceMock> {
  return {
    query: jest.fn().mockResolvedValue([{ ok: 1 }]),
  };
}

describe('HealthService', () => {
  it('returns live status without checking dependencies', () => {
    const dataSource = createDataSourceMock();
    const service = new HealthService(dataSource as unknown as DataSource);

    expect(service.getLiveness()).toEqual({
      status: 'ok',
      uptimeSeconds: expect.any(Number) as number,
      timestamp: expect.any(String) as string,
    });
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('returns ready status when PostgreSQL responds', async () => {
    const dataSource = createDataSourceMock();
    const service = new HealthService(dataSource as unknown as DataSource);

    await expect(service.getReadiness()).resolves.toEqual({
      status: 'ok',
      checks: {
        database: 'ok',
      },
      timestamp: expect.any(String) as string,
    });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1 AS ok');
  });

  it('throws service unavailable when PostgreSQL is down', async () => {
    const dataSource = createDataSourceMock();
    dataSource.query.mockRejectedValue(new Error('connection refused'));
    const service = new HealthService(dataSource as unknown as DataSource);

    await expect(service.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
