import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../database/entities/user-tenant-role.entity';
import { IntegrationOperationsService } from './integration-operations.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationOperationsController {
  constructor(private readonly service: IntegrationOperationsService) {}

  @Get('integration-exceptions')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async listExceptions(
    @Request() request: { user: { schemaName?: string; tenantId?: string } },
    @Query('status') status?: 'OPEN' | 'RETRYING' | 'RESOLVED',
    @Query('severity') severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  ) {
    return this.service.listExceptions(this.getSchemaName(request), {
      status,
      severity,
    });
  }

  @Post('integration-exceptions/:id/retry')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async retryException(
    @Request() request: { user: { schemaName?: string } },
    @Param('id') id: string,
  ) {
    return this.service.retryException(id, this.getSchemaName(request));
  }

  @Post('integration-exceptions/:id/resolve')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async resolveException(
    @Request() request: { user: { schemaName?: string; userId: string } },
    @Param('id') id: string,
  ) {
    return this.service.resolveException(
      id,
      request.user.userId,
      this.getSchemaName(request),
    );
  }

  @Get('integration-health')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async getHealth(@Request() request: { user: { schemaName?: string } }) {
    return this.service.getHealth(this.getSchemaName(request));
  }

  @Post('reconciliation-runs')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async triggerReconciliation(
    @Request() request: { user: { schemaName?: string; tenantId?: string } },
    @Query('channelAccountId') channelAccountId?: string,
  ) {
    return this.service.triggerReconciliation(
      this.getSchemaName(request),
      this.getTenantId(request),
      channelAccountId,
    );
  }

  private getSchemaName(request: { user: { schemaName?: string } }): string {
    if (!request.user.schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }
    return request.user.schemaName;
  }

  private getTenantId(request: { user: { tenantId?: string } }): string {
    if (!request.user.tenantId) {
      throw new NotFoundException('Tenant information not found');
    }
    return request.user.tenantId;
  }
}
