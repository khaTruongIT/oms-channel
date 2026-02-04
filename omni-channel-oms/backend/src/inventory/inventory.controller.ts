import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ReserveStockDto } from './dto/reserve-stock.dto';
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

@ApiTags('Inventory')
@ApiBearerAuth('JWT-auth')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @ApiOperation({ summary: 'Get all inventory' })
  @ApiResponse({ status: 200, description: 'Returns all inventory records' })
  @Get()
  async getAllInventory(@Request() req) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.inventoryService.getAllInventory(schemaName);
  }

  @ApiOperation({ summary: 'Get inventory by product' })
  @ApiParam({ name: 'masterSkuId', description: 'Master SKU ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns inventory for the product',
  })
  @Get('product/:masterSkuId')
  async getInventoryByProduct(
    @Request() req,
    @Param('masterSkuId') masterSkuId: string,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.inventoryService.getInventoryByProduct(masterSkuId, schemaName);
  }

  @ApiOperation({ summary: 'Get inventory by warehouse' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns inventory for the warehouse',
  })
  @Get('warehouse/:warehouseId')
  async getInventoryByWarehouse(
    @Request() req,
    @Param('warehouseId') warehouseId: string,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.inventoryService.getInventoryByWarehouse(
      warehouseId,
      schemaName,
    );
  }

  @ApiOperation({ summary: 'Adjust stock quantity' })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Post('adjust')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async adjustStock(@Request() req, @Body() adjustStockDto: AdjustStockDto) {
    const schemaName = req.user.schemaName;
    const userId = req.user.userId;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.inventoryService.adjustStock(
      adjustStockDto,
      userId,
      schemaName,
    );
  }

  @ApiOperation({ summary: 'Reserve stock for order' })
  @ApiResponse({ status: 201, description: 'Stock reserved successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  @Post('reserve')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_STAFF)
  async reserveStock(@Request() req, @Body() reserveStockDto: ReserveStockDto) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.inventoryService.reserveStock(reserveStockDto, schemaName);
  }
}
