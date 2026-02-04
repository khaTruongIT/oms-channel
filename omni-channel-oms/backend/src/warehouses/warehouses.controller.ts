import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { TenantLimitsService } from '../tenants/tenant-limits.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user-tenant-role.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Warehouses')
@ApiBearerAuth('JWT-auth')
@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  constructor(
    private readonly warehousesService: WarehousesService,
    private readonly tenantLimitsService: TenantLimitsService,
  ) {}

  @ApiOperation({ summary: 'Create a new warehouse' })
  @ApiResponse({ status: 201, description: 'Warehouse successfully created' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions or limit exceeded',
  })
  @Post()
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async createWarehouse(
    @Request() req,
    @Body() createWarehouseDto: CreateWarehouseDto,
  ) {
    const schemaName = req.user.schemaName;
    const tenantId = req.user.tenantId;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    // Enforce warehouse limit before creating
    if (tenantId) {
      await this.tenantLimitsService.enforceWarehouseLimit(tenantId);
    }

    return this.warehousesService.createWarehouse(
      createWarehouseDto,
      schemaName,
    );
  }

  @ApiOperation({ summary: 'Get all warehouses' })
  @ApiResponse({ status: 200, description: 'Returns list of all warehouses' })
  @Get()
  async getAllWarehouses(@Request() req) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.warehousesService.getAllWarehouses(schemaName);
  }

  @ApiOperation({ summary: 'Get warehouse by ID' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiResponse({ status: 200, description: 'Returns the warehouse' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  @Get(':id')
  async getWarehouse(@Request() req, @Param('id') id: string) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.warehousesService.getWarehouseById(id, schemaName);
  }
}
