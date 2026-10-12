import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { AppThrottlerGuard } from './app-throttler.guard';

describe('AppThrottlerGuard', () => {
  let guard: AppThrottlerGuard;
  let storageService: ThrottlerStorageService;
  let reflector: Reflector;

  beforeEach(() => {
    storageService = new ThrottlerStorageService();
    reflector = new Reflector();
    guard = new AppThrottlerGuard(
      [
        {
          name: 'default',
          ttl: 60000,
          limit: 100,
        },
      ],
      storageService,
      reflector,
    );
  });

  it('should use user id as tracker when request is authenticated', async () => {
    const req = {
      user: { userId: '11111111-1111-1111-1111-111111111111' },
      ip: '127.0.0.1',
      headers: {},
    };

    const tracker = await (guard as any).getTracker(req);
    expect(tracker).toBe('user-11111111-1111-1111-1111-111111111111');
  });

  it('should fallback to client IP as tracker when request is unauthenticated', async () => {
    const req = {
      ip: '192.168.1.100',
      headers: {},
    };

    const tracker = await (guard as any).getTracker(req);
    expect(tracker).toContain('192.168.1.100');
  });
});
