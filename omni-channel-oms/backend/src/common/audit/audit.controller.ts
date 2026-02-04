import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user-tenant-role.entity';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async getAuditLogs(
    @Request() req,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.auditService.getAuditLogs(schemaName, {
      entityType,
      entityId,
      userId,
      action,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('entity/:entityType/:entityId')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async getEntityHistory(
    @Request() req,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.auditService.getEntityHistory(entityType, entityId, schemaName);
  }
}
