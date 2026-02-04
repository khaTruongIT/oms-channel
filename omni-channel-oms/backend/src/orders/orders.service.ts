import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { InventoryService } from '../inventory/inventory.service';

export interface Order {
  id: string;
  orderNumber: string;
  channel: string;
  externalOrderId: string;
  customerName?: string;
  customerPhone?: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  syncedAt?: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  masterSkuId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventoryService: InventoryService,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    userId: string,
    schemaName: string,
  ): Promise<Order> {
    const {
      channel,
      externalOrderId,
      customerName,
      customerPhone,
      items,
      warehouseId,
    } = createOrderDto;

    // Check for duplicate order (idempotency)
    const existing = await this.dataSource.query(
      `SELECT id FROM "${schemaName}".orders WHERE channel = $1 AND external_order_id = $2`,
      [channel, externalOrderId],
    );

    if (existing.length > 0) {
      throw new ConflictException('Order already exists');
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create order
      const orderResult = await queryRunner.query(
        `INSERT INTO "${schemaName}".orders 
         (order_number, channel, external_order_id, customer_name, customer_phone, status, total_amount, synced_at)
         VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, NOW())
         RETURNING *`,
        [
          orderNumber,
          channel,
          externalOrderId,
          customerName,
          customerPhone,
          totalAmount,
        ],
      );

      const order = orderResult[0];

      // Create order items and reserve stock
      for (const item of items) {
        // Insert order item
        await queryRunner.query(
          `INSERT INTO "${schemaName}".order_items 
           (order_id, master_sku_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            order.id,
            item.masterSkuId,
            item.quantity,
            item.unitPrice,
            item.quantity * item.unitPrice,
          ],
        );

        // Reserve stock
        await this.inventoryService.reserveStock(
          {
            masterSkuId: item.masterSkuId,
            warehouseId,
            quantity: item.quantity,
          },
          schemaName,
        );
      }

      // Log order creation
      await queryRunner.query(
        `INSERT INTO "${schemaName}".audit_logs (user_id, action, entity_type, entity_id, changes)
         VALUES ($1, 'ORDER_CREATED', 'order', $2, $3)`,
        [
          userId,
          order.id,
          JSON.stringify({
            orderNumber,
            channel,
            totalAmount,
            itemCount: items.length,
          }),
        ],
      );

      await queryRunner.commitTransaction();

      return this.mapToOrder(order);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAllOrders(schemaName: string, channel?: string): Promise<Order[]> {
    let query = `SELECT * FROM "${schemaName}".orders`;
    const params: any[] = [];

    if (channel) {
      query += ` WHERE channel = $1`;
      params.push(channel);
    }

    query += ` ORDER BY created_at DESC`;

    const results = await this.dataSource.query(query, params);
    return results.map(this.mapToOrder);
  }

  async getOrderById(id: string, schemaName: string): Promise<Order> {
    const result = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".orders WHERE id = $1`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Order not found');
    }

    return this.mapToOrder(result[0]);
  }

  async getOrderItems(
    orderId: string,
    schemaName: string,
  ): Promise<OrderItem[]> {
    const results = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".order_items WHERE order_id = $1`,
      [orderId],
    );

    return results.map(this.mapToOrderItem);
  }

  async updateOrderStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    userId: string,
    schemaName: string,
  ): Promise<Order> {
    const { status } = updateOrderStatusDto;

    // Get current order
    const currentOrder = await this.getOrderById(id, schemaName);

    // If confirming order, deduct stock
    if (status === 'CONFIRMED' && currentOrder.status === 'PENDING') {
      await this.confirmAndDeductStock(id, userId, schemaName);
    }

    // Update status
    const result = await this.dataSource.query(
      `UPDATE "${schemaName}".orders
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Order not found');
    }

    // Log status change
    await this.dataSource.query(
      `INSERT INTO "${schemaName}".audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, 'ORDER_STATUS_UPDATED', 'order', $2, $3)`,
      [
        userId,
        id,
        JSON.stringify({ oldStatus: currentOrder.status, newStatus: status }),
      ],
    );

    return this.mapToOrder(result[0]);
  }

  private async confirmAndDeductStock(
    orderId: string,
    userId: string,
    schemaName: string,
  ): Promise<void> {
    // Get order items
    const items = await this.getOrderItems(orderId, schemaName);

    // Get warehouse from first item (assuming all items from same warehouse)
    // In a real system, you'd store warehouse_id in the order
    const warehouseResult = await this.dataSource.query(
      `SELECT warehouse_id FROM "${schemaName}".inventory 
       WHERE master_sku_id = $1 
       LIMIT 1`,
      [items[0].masterSkuId],
    );

    if (warehouseResult.length === 0) {
      throw new BadRequestException('No warehouse found for order items');
    }

    const warehouseId = warehouseResult[0].warehouse_id;

    // Deduct stock for each item
    for (const item of items) {
      await this.inventoryService.deductStock(
        item.masterSkuId,
        warehouseId,
        item.quantity,
        userId,
        schemaName,
      );
    }
  }

  private mapToOrder(row: any): Order {
    return {
      id: row.id,
      orderNumber: row.order_number,
      channel: row.channel,
      externalOrderId: row.external_order_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      status: row.status,
      totalAmount: parseFloat(row.total_amount),
      createdAt: row.created_at,
      syncedAt: row.synced_at,
    };
  }

  private mapToOrderItem(row: any): OrderItem {
    return {
      id: row.id,
      orderId: row.order_id,
      masterSkuId: row.master_sku_id,
      quantity: parseInt(row.quantity),
      unitPrice: parseFloat(row.unit_price),
      subtotal: parseFloat(row.subtotal),
    };
  }
}
