import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    // Skip if no user (public routes)
    if (!user || !user.tenantId) {
      return next();
    }

    const tenantId = user.tenantId;
    const schemaName = user.schemaName;

    if (!schemaName) {
      throw new UnauthorizedException('No tenant schema found');
    }

    // Set search_path for this request
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET search_path TO "${schemaName}", public`);
    } finally {
      await queryRunner.release();
    }

    next();
  }
}
