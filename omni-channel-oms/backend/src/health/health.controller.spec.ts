import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('exposes liveness status', () => {
    const healthService: Pick<HealthService, 'getLiveness' | 'getReadiness'> = {
      getLiveness: jest.fn().mockReturnValue({ status: 'ok' }),
      getReadiness: jest.fn(),
    };
    const controller = new HealthController(healthService as HealthService);

    expect(controller.live()).toEqual({ status: 'ok' });
    expect(healthService.getLiveness).toHaveBeenCalledTimes(1);
  });

  it('exposes readiness status', async () => {
    const healthService: Pick<HealthService, 'getLiveness' | 'getReadiness'> = {
      getLiveness: jest.fn(),
      getReadiness: jest.fn().mockResolvedValue({
        status: 'ok',
        checks: { database: 'ok' },
      }),
    };
    const controller = new HealthController(healthService as HealthService);

    await expect(controller.ready()).resolves.toEqual({
      status: 'ok',
      checks: { database: 'ok' },
    });
    expect(healthService.getReadiness).toHaveBeenCalledTimes(1);
  });
});
