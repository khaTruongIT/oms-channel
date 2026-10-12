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
  Headers,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { BulkUpdateOrderStatusDto } from './dto/bulk-update-order-status.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
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
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Post()
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER, UserRole.SALES_STAFF)
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    const schemaName = req.user.schemaName;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    if (!schemaName || !tenantId) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.ordersService.createOrder(
      createOrderDto,
      userId,
      schemaName,
      tenantId,
    );
  }

  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({
    name: 'channel',
    required: false,
    description: 'Filter by channel',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'externalOrderId',
    required: false,
    description: 'Filter by external marketplace order ID',
  })
  @ApiQuery({
    name: 'channelAccountId',
    required: false,
    description: 'Filter by channel account UUID',
  })
  @ApiResponse({ status: 200, description: 'Returns list of orders' })
  @Get()
  async getAllOrders(@Request() req, @Query() query: GetOrdersQueryDto) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.ordersService.getAllOrders(schemaName, query);
  }

  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Returns the order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get(':id')
  async getOrder(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.ordersService.getOrderById(id, schemaName);
  }

  @ApiOperation({ summary: 'Get order items' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Returns order items' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get(':id/items')
  async getOrderItems(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.ordersService.getOrderItems(id, schemaName);
  }

  @ApiOperation({ summary: 'Get order timeline events' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns order audit and inventory movements timeline',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get(':id/timeline')
  async getOrderTimeline(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.ordersService.getOrderTimeline(id, schemaName);
  }

  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Put(':id/status')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async updateOrderStatus(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const schemaName = req.user.schemaName;
    const userId = req.user.userId;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.ordersService.updateOrderStatus(
      id,
      updateOrderStatusDto,
      userId,
      schemaName,
    );
  }

  @ApiOperation({
    summary: 'Bulk update order status with per-order transactions',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk update results with succeeded and failed order lists',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Post('bulk-status')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async bulkUpdateOrderStatus(
    @Request() req,
    @Body() bulkDto: BulkUpdateOrderStatusDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const schemaName = req.user.schemaName;
    const userId = req.user.userId;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.ordersService.bulkUpdateOrderStatus(
      bulkDto,
      userId,
      schemaName,
      idempotencyKey,
    );
  }
}
