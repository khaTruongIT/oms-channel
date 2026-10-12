import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    if (req.user?.userId) {
      return `user-${req.user.userId}`;
    }
    return super.getTracker(req);
  }
}
