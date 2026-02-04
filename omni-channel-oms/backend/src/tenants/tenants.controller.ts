import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantLimitsService } from './tenant-limits.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateTenantsDto } from './dto/create-tenants.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Tenants')
@ApiBearerAuth('JWT-auth')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly tenantLimitsService: TenantLimitsService,
  ) {}

  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Post()
  async createTenant(@Request() req, @Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.createTenant(req.user.userId, createTenantDto);
  }

  @ApiOperation({ summary: 'Create multiple tenants at once' })
  @ApiResponse({ status: 201, description: 'Tenants successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Post('bulk')
  async createTenants(
    @Request() req,
    @Body() createTenantsDto: CreateTenantsDto,
  ) {
    return this.tenantsService.createTenants(
      req.user.userId,
      createTenantsDto.tenants,
    );
  }

  @ApiOperation({ summary: 'Get user tenants' })
  @ApiResponse({ status: 200, description: 'Returns list of user tenants' })
  @Get()
  async getTenants(@Request() req) {
    return this.tenantsService.getTenantsByUser(req.user.userId);
  }

  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 200, description: 'Returns tenant details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  async getTenantById(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.getTenantById(id);
  }

  @ApiOperation({ summary: 'Update tenant details' })
  @ApiResponse({ status: 200, description: 'Tenant successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  async updateTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.updateTenant(
      id,
      req.user.userId,
      updateTenantDto,
    );
  }

  // ==================== Status Management ====================

  @ApiOperation({ summary: 'Get tenant status' })
  @ApiResponse({ status: 200, description: 'Returns tenant status details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id/status')
  async getTenantStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.getTenantStatus(id);
  }

  @ApiOperation({ summary: 'Activate tenant' })
  @ApiResponse({ status: 200, description: 'Tenant activated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Post(':id/activate')
  async activateTenant(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.tenantsService.activateTenant(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Suspend tenant' })
  @ApiResponse({ status: 200, description: 'Tenant suspended successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Post(':id/suspend')
  async suspendTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    return this.tenantsService.suspendTenant(id, req.user.userId, reason);
  }

  @ApiOperation({ summary: 'Cancel tenant subscription' })
  @ApiResponse({ status: 200, description: 'Tenant cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Post(':id/cancel')
  async cancelTenant(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.tenantsService.cancelTenant(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Complete tenant onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Onboarding already completed' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Post(':id/complete-onboarding')
  async completeOnboarding(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.tenantsService.completeOnboarding(id, req.user.userId);
  }

  // ==================== Limits & Usage ====================

  @ApiOperation({ summary: 'Get tenant usage statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns usage stats (products, warehouses, channels)',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id/usage')
  async getUsageStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantLimitsService.getUsageStats(id);
  }
}
