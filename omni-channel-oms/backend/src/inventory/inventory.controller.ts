import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { GetInventoryQueryDto } from './dto/get-inventory-query.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { UpdateSafetyStockDto } from './dto/update-safety-stock.dto';
import { GetMovementsQueryDto } from './dto/get-movements-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user-tenant-role.entity';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
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

  @ApiOperation({
    summary: 'Get inventory list with pagination, ATS, and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns inventory list (paginated or legacy array)',
  })
  @Get()
  async getInventory(
    @Request() req: AuthenticatedRequest,
    @Query() query: GetInventoryQueryDto,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.inventoryService.getInventory(query, schemaName);
  }

  @ApiOperation({ summary: 'Get inventory movements ledger' })
  @ApiResponse({
    status: 200,
    description: 'Returns inventory movements ledger records',
  })
  @Get('movements')
  async getMovements(
    @Request() req: AuthenticatedRequest,
    @Query() query: GetMovementsQueryDto,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.inventoryService.getMovements(query, schemaName);
  }

  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  @ApiResponse({
    status: 201,
    description: 'Stock transferred successfully between warehouses',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (e.g. inactive destination or same warehouse)',
  })
  @ApiResponse({
    status: 409,
    description: 'Insufficient stock in source warehouse',
  })
  @Post('transfer')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async transferStock(
    @Request() req: AuthenticatedRequest,
    @Body() transferStockDto: TransferStockDto,
  ) {
    const schemaName = req.user.schemaName;
    const userId = req.user.userId;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.inventoryService.transferStock(
      transferStockDto,
      userId,
      schemaName,
    );
  }

  @ApiOperation({ summary: 'Configure warehouse safety stock for a SKU' })
  @ApiResponse({
    status: 200,
    description: 'Safety stock configured successfully',
  })
  @Put('safety-stock')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async updateSafetyStock(
    @Request() req: AuthenticatedRequest,
    @Body() updateSafetyStockDto: UpdateSafetyStockDto,
  ) {
    const schemaName = req.user.schemaName;
    const userId = req.user.userId;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.inventoryService.updateSafetyStock(
      updateSafetyStockDto,
      userId,
      schemaName,
    );
  }

  @ApiOperation({ summary: 'Get inventory by product' })
  @ApiParam({ name: 'masterSkuId', description: 'Master SKU ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns inventory for the product',
  })
  @Get('product/:masterSkuId')
  async getInventoryByProduct(
    @Request() req: AuthenticatedRequest,
    @Param('masterSkuId', ParseUUIDPipe) masterSkuId: string,
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
    @Request() req: AuthenticatedRequest,
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
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
  async adjustStock(
    @Request() req: AuthenticatedRequest,
    @Body() adjustStockDto: AdjustStockDto,
  ) {
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
  async reserveStock(
    @Request() req: AuthenticatedRequest,
    @Body() reserveStockDto: ReserveStockDto,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.inventoryService.reserveManualStock(
      reserveStockDto,
      req.user.userId,
      schemaName,
    );
  }
}
