import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { StockSyncScheduler } from './stock-sync.scheduler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user-tenant-role.entity';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly stockSyncScheduler: StockSyncScheduler,
  ) {}

  @Post('sync/trigger')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async triggerBatchSync(@Request() req: AuthenticatedRequest) {
    const schemaName = req.user.schemaName;
    const tenantId = req.user.tenantId;

    if (!schemaName || !tenantId) {
      throw new NotFoundException('Tenant information not found');
    }

    return this.stockSyncScheduler.triggerBatchSync(schemaName, tenantId);
  }

  @Get('status/:queueName/:jobId')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async getJobStatus(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!req.user.tenantId) {
      throw new NotFoundException('Tenant information not found');
    }

    return this.jobsService.getJobStatus(queueName, jobId, req.user.tenantId);
  }
}
