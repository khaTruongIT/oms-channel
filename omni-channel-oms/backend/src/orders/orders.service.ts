import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  InventoryService,
  type QueryExecutor,
} from '../inventory/inventory.service';
import { ChannelAccountsService } from '../channel-accounts/channel-accounts.service';

export interface Order {
  id: string;
  orderNumber: string;
  channel: string;
  channelAccountId?: string;
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
  warehouseId?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventoryService: InventoryService,
    private readonly channelAccountsService?: ChannelAccountsService,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    userId: string,
    schemaName: string,
    tenantId?: string,
  ): Promise<Order> {
    const {
      channel,
      channelAccountId,
      externalOrderId,
      customerName,
      customerPhone,
      items,
      warehouseId,
    } = createOrderDto;

    if (channelAccountId) {
      if (!tenantId) {
        throw new BadRequestException(
          'Tenant information is required for a channel account order',
        );
      }
      if (!this.channelAccountsService) {
        throw new BadRequestException(
          'Channel account validation is unavailable',
        );
      }
      await this.channelAccountsService.getForTenant(
        channelAccountId,
        tenantId,
      );
    }

    // Check for duplicate order (idempotency). Legacy manual orders keep a
    // channel-scoped key; marketplace orders scope it to the connected account.
    const existing = await this.dataSource.query<Pick<OrderRow, 'id'>[]>(
      channelAccountId
        ? `SELECT id FROM "${schemaName}".orders WHERE channel_account_id = $1 AND external_order_id = $2`
        : `SELECT id FROM "${schemaName}".orders WHERE channel_account_id IS NULL AND channel = $1 AND external_order_id = $2`,
      channelAccountId
        ? [channelAccountId, externalOrderId]
        : [channel, externalOrderId],
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
      const orderResult = await this.queryRows<OrderRow>(
        queryRunner,
        `INSERT INTO "${schemaName}".orders 
         (order_number, channel, channel_account_id, external_order_id, customer_name, customer_phone, status, total_amount, synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, NOW())
         RETURNING *`,
        [
          orderNumber,
          channel,
          channelAccountId ?? null,
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
           (order_id, master_sku_id, warehouse_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            order.id,
            item.masterSkuId,
            warehouseId,
            item.quantity,
            item.unitPrice,
            item.quantity * item.unitPrice,
          ],
        );

        // Reserve stock
        const inventory = await this.inventoryService.reserveStock(
          {
            masterSkuId: item.masterSkuId,
            warehouseId,
            quantity: item.quantity,
          },
          schemaName,
          queryRunner,
        );

        await this.recordMovement(queryRunner, schemaName, {
          inventoryId: inventory.id,
          masterSkuId: item.masterSkuId,
          warehouseId,
          orderId: order.id,
          type: 'RESERVE',
          quantityDelta: 0,
          reservedDelta: item.quantity,
          idempotencyKey: `order:${order.id}:reserve:${item.masterSkuId}`,
          userId,
        });
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

      await this.enqueueOutboxEvent(queryRunner, schemaName, {
        channelAccountId,
        eventType: 'ORDER_CREATED',
        aggregateId: order.id,
        payload: { orderNumber, externalOrderId },
      });

      await queryRunner.commitTransaction();

      return this.mapToOrder(order);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException('Order already exists');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAllOrders(schemaName: string, channel?: string): Promise<Order[]> {
    let query = `SELECT * FROM "${schemaName}".orders`;
    const params: unknown[] = [];

    if (channel) {
      query += ` WHERE channel = $1`;
      params.push(channel);
    }

    query += ` ORDER BY created_at DESC`;

    const results = await this.dataSource.query<OrderRow[]>(query, params);
    return results.map((row) => this.mapToOrder(row));
  }

  async getOrderById(id: string, schemaName: string): Promise<Order> {
    return this.getOrderByIdWithExecutor(id, schemaName, this.dataSource);
  }

  async getOrderItems(
    orderId: string,
    schemaName: string,
  ): Promise<OrderItem[]> {
    return this.getOrderItemsWithExecutor(orderId, schemaName, this.dataSource);
  }

  async updateOrderStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    userId: string,
    schemaName: string,
  ): Promise<Order> {
    const { status } = updateOrderStatusDto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currentOrder = await this.getOrderByIdWithExecutor(
        id,
        schemaName,
        queryRunner,
        true,
      );
      this.assertValidStatusTransition(currentOrder.status, status);

      if (status === 'CONFIRMED' && currentOrder.status === 'PENDING') {
        await this.deductReservedStock(id, userId, schemaName, queryRunner);
      }

      if (status === 'CANCELLED') {
        if (currentOrder.status === 'PENDING') {
          await this.releaseReservedStock(id, userId, schemaName, queryRunner);
        } else {
          await this.restockDeductedStock(id, userId, schemaName, queryRunner);
        }
      }

      const result = await this.queryRows<OrderRow>(
        queryRunner,
        `UPDATE "${schemaName}".orders
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id],
      );

      if (result.length === 0) {
        throw new NotFoundException('Order not found');
      }

      await queryRunner.query(
        `INSERT INTO "${schemaName}".audit_logs (user_id, action, entity_type, entity_id, changes)
         VALUES ($1, 'ORDER_STATUS_UPDATED', 'order', $2, $3)`,
        [
          userId,
          id,
          JSON.stringify({
            oldStatus: currentOrder.status,
            newStatus: status,
          }),
        ],
      );

      await this.enqueueOutboxEvent(queryRunner, schemaName, {
        channelAccountId: currentOrder.channelAccountId,
        eventType: 'ORDER_STATUS_CHANGED',
        aggregateId: id,
        payload: { previousStatus: currentOrder.status, status },
      });

      await queryRunner.commitTransaction();
      return this.mapToOrder(result[0]);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async deductReservedStock(
    orderId: string,
    userId: string,
    schemaName: string,
    executor: QueryExecutor,
  ): Promise<void> {
    const items = await this.getOrderItemsWithExecutor(
      orderId,
      schemaName,
      executor,
    );
    if (items.length === 0) {
      throw new BadRequestException('Order has no items');
    }

    for (const item of items) {
      const warehouseId = await this.resolveWarehouseId(
        item,
        schemaName,
        executor,
      );
      const inventory = await this.inventoryService.deductStock(
        item.masterSkuId,
        warehouseId,
        item.quantity,
        userId,
        schemaName,
        executor,
      );
      await this.recordMovement(executor, schemaName, {
        inventoryId: inventory.id,
        masterSkuId: item.masterSkuId,
        warehouseId,
        orderId,
        type: 'DEDUCT',
        quantityDelta: -item.quantity,
        reservedDelta: -item.quantity,
        idempotencyKey: `order:${orderId}:deduct:${item.id}`,
        userId,
      });
    }
  }

  private async releaseReservedStock(
    orderId: string,
    userId: string,
    schemaName: string,
    executor: QueryExecutor,
  ): Promise<void> {
    const items = await this.getOrderItemsWithExecutor(
      orderId,
      schemaName,
      executor,
    );
    if (items.length === 0) {
      throw new BadRequestException('Order has no items');
    }

    for (const item of items) {
      const warehouseId = await this.resolveWarehouseId(
        item,
        schemaName,
        executor,
      );
      const inventory = await this.inventoryService.releaseReservation(
        item.masterSkuId,
        warehouseId,
        item.quantity,
        schemaName,
        executor,
      );
      await this.recordMovement(executor, schemaName, {
        inventoryId: inventory.id,
        masterSkuId: item.masterSkuId,
        warehouseId,
        orderId,
        type: 'RELEASE',
        quantityDelta: 0,
        reservedDelta: -item.quantity,
        idempotencyKey: `order:${orderId}:release:${item.id}`,
        userId,
      });
    }
  }

  private async restockDeductedStock(
    orderId: string,
    userId: string,
    schemaName: string,
    executor: QueryExecutor,
  ): Promise<void> {
    const items = await this.getOrderItemsWithExecutor(
      orderId,
      schemaName,
      executor,
    );
    if (items.length === 0) {
      throw new BadRequestException('Order has no items');
    }

    for (const item of items) {
      const warehouseId = await this.resolveWarehouseId(
        item,
        schemaName,
        executor,
      );
      const inventory = await this.inventoryService.restockStock(
        item.masterSkuId,
        warehouseId,
        item.quantity,
        schemaName,
        executor,
      );
      await this.recordMovement(executor, schemaName, {
        inventoryId: inventory.id,
        masterSkuId: item.masterSkuId,
        warehouseId,
        orderId,
        type: 'RESTOCK',
        quantityDelta: item.quantity,
        reservedDelta: 0,
        idempotencyKey: `order:${orderId}:restock:${item.id}`,
        userId,
      });
    }
  }

  private async resolveWarehouseId(
    item: OrderItem,
    schemaName: string,
    executor: QueryExecutor,
  ): Promise<string> {
    if (item.warehouseId) {
      return item.warehouseId;
    }

    return this.findWarehouseForOrderItems([item], schemaName, executor);
  }

  private async findWarehouseForOrderItems(
    items: OrderItem[],
    schemaName: string,
    executor: QueryExecutor,
  ): Promise<string> {
    const warehouseResult = await this.queryRows<WarehouseRow>(
      executor,
      `SELECT warehouse_id FROM "${schemaName}".inventory
       WHERE master_sku_id = $1
       LIMIT 1`,
      [items[0].masterSkuId],
    );

    if (warehouseResult.length === 0) {
      throw new BadRequestException('No warehouse found for order items');
    }

    return warehouseResult[0].warehouse_id;
  }

  private async getOrderByIdWithExecutor(
    id: string,
    schemaName: string,
    executor: QueryExecutor,
    lockForUpdate = false,
  ): Promise<Order> {
    const result = await this.queryRows<OrderRow>(
      executor,
      `SELECT * FROM "${schemaName}".orders WHERE id = $1${lockForUpdate ? ' FOR UPDATE' : ''}`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Order not found');
    }

    return this.mapToOrder(result[0]);
  }

  private async getOrderItemsWithExecutor(
    orderId: string,
    schemaName: string,
    executor: QueryExecutor,
  ): Promise<OrderItem[]> {
    const results = await this.queryRows<OrderItemRow>(
      executor,
      `SELECT * FROM "${schemaName}".order_items WHERE order_id = $1`,
      [orderId],
    );

    return results.map((row) => this.mapToOrderItem(row));
  }

  private assertValidStatusTransition(from: string, to: string): void {
    if (from === to) {
      return;
    }

    const allowedTransitions = ORDER_STATUS_TRANSITIONS[from as OrderStatus];
    if (!allowedTransitions?.includes(to as OrderStatus)) {
      throw new BadRequestException(
        `Cannot transition order from ${from} to ${to}`,
      );
    }
  }

  private async queryRows<T>(
    executor: QueryExecutor,
    query: string,
    parameters?: unknown[],
  ): Promise<T[]> {
    return executor.query<T[]>(query, parameters);
  }

  private async recordMovement(
    executor: QueryExecutor,
    schemaName: string,
    movement: {
      inventoryId: string;
      masterSkuId: string;
      warehouseId: string;
      orderId: string;
      type: 'RESERVE' | 'RELEASE' | 'DEDUCT' | 'RESTOCK';
      quantityDelta: number;
      reservedDelta: number;
      idempotencyKey: string;
      userId: string;
    },
  ): Promise<void> {
    await executor.query(
      `INSERT INTO "${schemaName}".inventory_movements
       (inventory_id, master_sku_id, warehouse_id, order_id, movement_type, quantity_delta, reserved_delta, idempotency_key, actor_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        movement.inventoryId,
        movement.masterSkuId,
        movement.warehouseId,
        movement.orderId,
        movement.type,
        movement.quantityDelta,
        movement.reservedDelta,
        movement.idempotencyKey,
        movement.userId,
      ],
    );
  }

  private async enqueueOutboxEvent(
    executor: QueryExecutor,
    schemaName: string,
    event: {
      channelAccountId?: string;
      eventType: 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED';
      aggregateId: string;
      payload: Record<string, string>;
    },
  ): Promise<void> {
    if (!event.channelAccountId) {
      return;
    }

    await executor.query(
      `INSERT INTO "${schemaName}".outbox_events
       (channel_account_id, event_type, aggregate_type, aggregate_id, payload)
       VALUES ($1, $2, 'order', $3, $4)`,
      [
        event.channelAccountId,
        event.eventType,
        event.aggregateId,
        JSON.stringify(event.payload),
      ],
    );
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const databaseError = error as { code?: unknown };
    return databaseError.code === '23505';
  }

  private mapToOrder(row: OrderRow): Order {
    return {
      id: row.id,
      orderNumber: row.order_number,
      channel: row.channel,
      channelAccountId: row.channel_account_id ?? undefined,
      externalOrderId: row.external_order_id,
      customerName: row.customer_name ?? undefined,
      customerPhone: row.customer_phone ?? undefined,
      status: row.status,
      totalAmount: Number(row.total_amount),
      createdAt:
        row.created_at instanceof Date
          ? row.created_at
          : new Date(row.created_at),
      syncedAt:
        row.synced_at === null || row.synced_at === undefined
          ? undefined
          : row.synced_at instanceof Date
            ? row.synced_at
            : new Date(row.synced_at),
    };
  }

  private mapToOrderItem(row: OrderItemRow): OrderItem {
    return {
      id: row.id,
      orderId: row.order_id,
      masterSkuId: row.master_sku_id,
      warehouseId: row.warehouse_id ?? undefined,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unit_price),
      subtotal: Number(row.subtotal),
    };
  }
}

interface OrderRow {
  id: string;
  order_number: string;
  channel: string;
  channel_account_id?: string | null;
  external_order_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  status: string;
  total_amount: string | number;
  created_at: Date | string;
  synced_at?: Date | string | null;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  master_sku_id: string;
  warehouse_id?: string | null;
  quantity: string | number;
  unit_price: string | number;
  subtotal: string | number;
}

interface WarehouseRow {
  warehouse_id: string;
}
