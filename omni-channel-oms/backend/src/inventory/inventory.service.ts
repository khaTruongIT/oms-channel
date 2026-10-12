import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationSeverity,
} from '../notifications/entities/notification.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { GetInventoryQueryDto } from './dto/get-inventory-query.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { UpdateSafetyStockDto } from './dto/update-safety-stock.dto';
import { GetMovementsQueryDto } from './dto/get-movements-query.dto';
import { Paginated, PaginationMeta } from '../common/pagination/pagination.dto';
import { ErrorCode } from '../common/errors/error-codes';

export interface QueryExecutor {
  query<T = unknown>(query: string, parameters?: unknown[]): Promise<T>;
}

export interface InventoryItem {
  id: string;
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  safetyStock: number;
  availableQuantity: number;
  ats: number;
  skuCode?: string;
  productName?: string;
  warehouseName?: string;
  updatedAt: Date;
}

export interface InventoryMovementItem {
  id: string;
  inventoryId: string;
  masterSkuId: string;
  skuCode?: string;
  productName?: string;
  warehouseId: string;
  warehouseName?: string;
  orderId?: string;
  movementType: string;
  quantityDelta: number;
  reservedDelta: number;
  idempotencyKey: string;
  actorUserId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface StockTransferResult {
  masterSkuId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  sourceQuantity: number;
  destinationQuantity: number;
  idempotencyKey: string;
}

interface InventoryRow {
  id: string;
  master_sku_id: string;
  warehouse_id: string;
  quantity: string | number;
  reserved_quantity: string | number;
  safety_stock: string | number;
  updated_at: Date | string;
  sku_code?: string;
  product_name?: string;
  warehouse_name?: string;
}

interface MovementRow {
  id: string;
  inventory_id: string;
  master_sku_id: string;
  warehouse_id: string;
  order_id?: string | null;
  movement_type: string;
  quantity_delta: string | number;
  reserved_delta: string | number;
  idempotency_key: string;
  actor_user_id?: string | null;
  metadata?: Record<string, any> | string | null;
  created_at: Date | string;
  sku_code?: string;
  product_name?: string;
  warehouse_name?: string;
}

interface ReservationInput {
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly dataSource: DataSource,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  async getInventory(
    query: GetInventoryQueryDto,
    schemaName: string,
  ): Promise<Paginated<InventoryItem> | InventoryItem[]> {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];

    if (query.warehouseId) {
      params.push(query.warehouseId);
      conditions.push(`i.warehouse_id = $${params.length}`);
    }

    if (query.masterSkuId) {
      params.push(query.masterSkuId);
      conditions.push(`i.master_sku_id = $${params.length}`);
    }

    if (query.lowStock === true) {
      conditions.push(
        `(i.quantity - i.reserved_quantity <= i.safety_stock OR (i.quantity - i.reserved_quantity - i.safety_stock) <= 0)`,
      );
    }

    if (query.q) {
      params.push(`%${query.q.trim()}%`);
      conditions.push(
        `(ms.sku_code ILIKE $${params.length} OR ms.product_name ILIKE $${params.length})`,
      );
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // D4 transition rule: page or limit provided -> enveloped pagination
    if (query.page !== undefined || query.limit !== undefined) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const offset = (page - 1) * limit;

      const countResult = await this.dataSource.query<
        Array<{ count: string | number }>
      >(
        `SELECT COUNT(*) as count
         FROM "${schemaName}".inventory i
         LEFT JOIN "${schemaName}".master_skus ms ON ms.id = i.master_sku_id
         LEFT JOIN "${schemaName}".warehouses w ON w.id = i.warehouse_id
         ${whereClause}`,
        params,
      );

      const total = Number(countResult[0]?.count || 0);
      const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

      const results = await this.dataSource.query<InventoryRow[]>(
        `SELECT
           i.id,
           i.master_sku_id,
           i.warehouse_id,
           i.quantity,
           i.reserved_quantity,
           i.safety_stock,
           i.updated_at,
           ms.sku_code,
           ms.product_name,
           w.name as warehouse_name
         FROM "${schemaName}".inventory i
         LEFT JOIN "${schemaName}".master_skus ms ON ms.id = i.master_sku_id
         LEFT JOIN "${schemaName}".warehouses w ON w.id = i.warehouse_id
         ${whereClause}
         ORDER BY i.updated_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      );

      return {
        data: results.map((r) => this.mapToInventoryItem(r)),
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1 && totalPages > 0,
        },
      };
    }

    // Legacy unpaginated response
    const results = await this.dataSource.query<InventoryRow[]>(
      `SELECT
         i.id,
         i.master_sku_id,
         i.warehouse_id,
         i.quantity,
         i.reserved_quantity,
         i.safety_stock,
         i.updated_at,
         ms.sku_code,
         ms.product_name,
         w.name as warehouse_name
       FROM "${schemaName}".inventory i
       LEFT JOIN "${schemaName}".master_skus ms ON ms.id = i.master_sku_id
       LEFT JOIN "${schemaName}".warehouses w ON w.id = i.warehouse_id
       ${whereClause}
       ORDER BY i.updated_at DESC`,
      params,
    );

    return results.map((r) => this.mapToInventoryItem(r));
  }

  async getMovements(
    query: GetMovementsQueryDto,
    schemaName: string,
  ): Promise<Paginated<InventoryMovementItem> | InventoryMovementItem[]> {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];

    if (query.masterSkuId) {
      params.push(query.masterSkuId);
      conditions.push(`m.master_sku_id = $${params.length}`);
    }

    if (query.warehouseId) {
      params.push(query.warehouseId);
      conditions.push(`m.warehouse_id = $${params.length}`);
    }

    if (query.orderId) {
      params.push(query.orderId);
      conditions.push(`m.order_id = $${params.length}`);
    }

    if (query.movementType) {
      params.push(query.movementType);
      conditions.push(`m.movement_type = $${params.length}`);
    }

    if (query.from) {
      params.push(new Date(query.from));
      conditions.push(`m.created_at >= $${params.length}`);
    }

    if (query.to) {
      params.push(new Date(query.to));
      conditions.push(`m.created_at <= $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    if (query.page !== undefined || query.limit !== undefined) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const offset = (page - 1) * limit;

      const countResult = await this.dataSource.query<
        Array<{ count: string | number }>
      >(
        `SELECT COUNT(*) as count
         FROM "${schemaName}".inventory_movements m
         ${whereClause}`,
        params,
      );

      const total = Number(countResult[0]?.count || 0);
      const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

      const results = await this.dataSource.query<MovementRow[]>(
        `SELECT
           m.*,
           ms.sku_code,
           ms.product_name,
           w.name as warehouse_name
         FROM "${schemaName}".inventory_movements m
         LEFT JOIN "${schemaName}".master_skus ms ON ms.id = m.master_sku_id
         LEFT JOIN "${schemaName}".warehouses w ON w.id = m.warehouse_id
         ${whereClause}
         ORDER BY m.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      );

      return {
        data: results.map((r) => this.mapToMovementItem(r)),
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1 && totalPages > 0,
        },
      };
    }

    const results = await this.dataSource.query<MovementRow[]>(
      `SELECT
         m.*,
         ms.sku_code,
         ms.product_name,
         w.name as warehouse_name
       FROM "${schemaName}".inventory_movements m
       LEFT JOIN "${schemaName}".master_skus ms ON ms.id = m.master_sku_id
       LEFT JOIN "${schemaName}".warehouses w ON w.id = m.warehouse_id
       ${whereClause}
       ORDER BY m.created_at DESC`,
      params,
    );

    return results.map((r) => this.mapToMovementItem(r));
  }

  async transferStock(
    dto: TransferStockDto,
    userId: string,
    schemaName: string,
  ): Promise<StockTransferResult> {
    const { fromWarehouseId, toWarehouseId, masterSkuId, quantity, notes } = dto;

    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouse cannot be identical',
      );
    }

    const idempotencyKey =
      dto.idempotencyKey ||
      `transfer-${fromWarehouseId}-${toWarehouseId}-${masterSkuId}-${Date.now()}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Idempotency check: see if transfer movements with this key already exist
      const prior = (await queryRunner.query(
        `SELECT id, metadata FROM "${schemaName}".inventory_movements
         WHERE idempotency_key = $1 OR idempotency_key = $2
         LIMIT 1`,
        [`${idempotencyKey}:OUT`, idempotencyKey],
      )) as Array<{ id: string; metadata: any }>;

      if (prior.length > 0) {
        const sourceInv = (await queryRunner.query(
          `SELECT * FROM "${schemaName}".inventory WHERE master_sku_id = $1 AND warehouse_id = $2`,
          [masterSkuId, fromWarehouseId],
        )) as InventoryRow[];
        const destInv = (await queryRunner.query(
          `SELECT * FROM "${schemaName}".inventory WHERE master_sku_id = $1 AND warehouse_id = $2`,
          [masterSkuId, toWarehouseId],
        )) as InventoryRow[];
        await queryRunner.commitTransaction();
        return {
          masterSkuId,
          fromWarehouseId,
          toWarehouseId,
          quantity,
          sourceQuantity: Number(sourceInv[0]?.quantity || 0),
          destinationQuantity: Number(destInv[0]?.quantity || 0),
          idempotencyKey,
        };
      }

      // Check destination warehouse is active
      const destWarehouse = (await queryRunner.query(
        `SELECT id, is_active FROM "${schemaName}".warehouses WHERE id = $1`,
        [toWarehouseId],
      )) as Array<{ id: string; is_active: boolean }>;
      if (destWarehouse.length === 0 || !destWarehouse[0].is_active) {
        throw new BadRequestException(
          'Destination warehouse is inactive or not found',
        );
      }

      // Check source warehouse is active
      const sourceWarehouse = (await queryRunner.query(
        `SELECT id, is_active FROM "${schemaName}".warehouses WHERE id = $1`,
        [fromWarehouseId],
      )) as Array<{ id: string; is_active: boolean }>;
      if (sourceWarehouse.length === 0 || !sourceWarehouse[0].is_active) {
        throw new BadRequestException(
          'Source warehouse is inactive or not found',
        );
      }

      // Deadlock prevention: lock inventory rows in deterministic sorted order
      const sortedWarehouseIds = [fromWarehouseId, toWarehouseId].sort();
      await queryRunner.query(
        `SELECT * FROM "${schemaName}".inventory
         WHERE master_sku_id = $1 AND warehouse_id IN ($2, $3)
         ORDER BY warehouse_id ASC
         FOR UPDATE`,
        [masterSkuId, sortedWarehouseIds[0], sortedWarehouseIds[1]],
      );

      // Fetch source inventory row
      const sourceRows = (await queryRunner.query(
        `SELECT * FROM "${schemaName}".inventory
         WHERE master_sku_id = $1 AND warehouse_id = $2`,
        [masterSkuId, fromWarehouseId],
      )) as InventoryRow[];

      if (sourceRows.length === 0) {
        throw new ConflictException({
          code: ErrorCode.STOCK_INSUFFICIENT,
          message: 'Insufficient stock: source inventory record does not exist',
        });
      }

      const sourceRow = sourceRows[0];
      const sourceQty = Number(sourceRow.quantity);
      const sourceReserved = Number(sourceRow.reserved_quantity);
      const sourceAvailable = sourceQty - sourceReserved;

      if (sourceAvailable < quantity) {
        throw new ConflictException({
          code: ErrorCode.STOCK_INSUFFICIENT,
          message: `Insufficient stock in source warehouse: requested ${quantity}, available ${sourceAvailable}`,
        });
      }

      // Fetch or insert destination inventory row
      let destRows = (await queryRunner.query(
        `SELECT * FROM "${schemaName}".inventory
         WHERE master_sku_id = $1 AND warehouse_id = $2`,
        [masterSkuId, toWarehouseId],
      )) as InventoryRow[];

      if (destRows.length === 0) {
        destRows = (await queryRunner.query(
          `INSERT INTO "${schemaName}".inventory
           (master_sku_id, warehouse_id, quantity, reserved_quantity, safety_stock)
           VALUES ($1, $2, 0, 0, 0)
           RETURNING *`,
          [masterSkuId, toWarehouseId],
        )) as InventoryRow[];
      }

      const destRow = destRows[0];

      // Update source inventory
      const updatedSourceRows = (await queryRunner.query(
        `UPDATE "${schemaName}".inventory
         SET quantity = quantity - $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [quantity, sourceRow.id],
      )) as InventoryRow[];

      // Update destination inventory
      const updatedDestRows = (await queryRunner.query(
        `UPDATE "${schemaName}".inventory
         SET quantity = quantity + $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [quantity, destRow.id],
      )) as InventoryRow[];

      // Record 2 movements in ledger
      await queryRunner.query(
        `INSERT INTO "${schemaName}".inventory_movements
         (inventory_id, master_sku_id, warehouse_id, movement_type, quantity_delta, reserved_delta, idempotency_key, actor_user_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          sourceRow.id,
          masterSkuId,
          fromWarehouseId,
          'TRANSFER_OUT',
          -quantity,
          0,
          `${idempotencyKey}:OUT`,
          userId,
          JSON.stringify({ toWarehouseId, notes: notes || null }),
        ],
      );

      await queryRunner.query(
        `INSERT INTO "${schemaName}".inventory_movements
         (inventory_id, master_sku_id, warehouse_id, movement_type, quantity_delta, reserved_delta, idempotency_key, actor_user_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          destRow.id,
          masterSkuId,
          toWarehouseId,
          'TRANSFER_IN',
          quantity,
          0,
          `${idempotencyKey}:IN`,
          userId,
          JSON.stringify({ fromWarehouseId, notes: notes || null }),
        ],
      );

      // Log audit
      await this.logAudit(
        userId,
        'TRANSFER',
        'inventory',
        sourceRow.id,
        { fromWarehouseId, toWarehouseId, masterSkuId, quantity, notes },
        schemaName,
        queryRunner,
      );

      await queryRunner.commitTransaction();

      return {
        masterSkuId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        sourceQuantity: Number(updatedSourceRows[0].quantity),
        destinationQuantity: Number(updatedDestRows[0].quantity),
        idempotencyKey,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateSafetyStock(
    dto: UpdateSafetyStockDto,
    userId: string,
    schemaName: string,
  ): Promise<InventoryItem> {
    const { masterSkuId, warehouseId, safetyStock } = dto;

    if (safetyStock < 0) {
      throw new BadRequestException('Safety stock must be non-negative');
    }

    const warehouse = await this.dataSource.query<
      Array<{ id: string; is_active: boolean }>
    >(
      `SELECT id, is_active FROM "${schemaName}".warehouses WHERE id = $1 AND is_active = TRUE`,
      [warehouseId],
    );
    if (warehouse.length === 0) {
      throw new NotFoundException('Warehouse not found or inactive');
    }

    const sku = await this.dataSource.query<Array<{ id: string }>>(
      `SELECT id FROM "${schemaName}".master_skus WHERE id = $1`,
      [masterSkuId],
    );
    if (sku.length === 0) {
      throw new NotFoundException('Master SKU not found');
    }

    const existing = await this.dataSource.query<InventoryRow[]>(
      `SELECT * FROM "${schemaName}".inventory WHERE master_sku_id = $1 AND warehouse_id = $2`,
      [masterSkuId, warehouseId],
    );

    let result: InventoryRow;
    if (existing.length === 0) {
      const inserted = await this.dataSource.query<InventoryRow[]>(
        `INSERT INTO "${schemaName}".inventory
         (master_sku_id, warehouse_id, quantity, reserved_quantity, safety_stock)
         VALUES ($1, $2, 0, 0, $3)
         RETURNING *`,
        [masterSkuId, warehouseId, safetyStock],
      );
      result = inserted[0];
    } else {
      const updated = await this.dataSource.query<InventoryRow[]>(
        `UPDATE "${schemaName}".inventory
         SET safety_stock = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [safetyStock, existing[0].id],
      );
      result = updated[0];
    }

    await this.logAudit(
      userId,
      'UPDATE_SAFETY_STOCK',
      'inventory',
      result.id,
      { masterSkuId, warehouseId, safetyStock },
      schemaName,
    );

    return this.mapToInventoryItem(result);
  }

  async getInventoryByProduct(
    masterSkuId: string,
    schemaName: string,
  ): Promise<InventoryItem[]> {
    const results = await this.dataSource.query<InventoryRow[]>(
      `SELECT
         i.*,
         ms.sku_code,
         ms.product_name,
         w.name as warehouse_name
       FROM "${schemaName}".inventory i
       LEFT JOIN "${schemaName}".master_skus ms ON ms.id = i.master_sku_id
       LEFT JOIN "${schemaName}".warehouses w ON w.id = i.warehouse_id
       WHERE i.master_sku_id = $1`,
      [masterSkuId],
    );

    return results.map((row) => this.mapToInventoryItem(row));
  }

  async getInventoryByWarehouse(
    warehouseId: string,
    schemaName: string,
  ): Promise<InventoryItem[]> {
    const results = await this.dataSource.query<InventoryRow[]>(
      `SELECT
         i.*,
         ms.sku_code,
         ms.product_name,
         w.name as warehouse_name
       FROM "${schemaName}".inventory i
       LEFT JOIN "${schemaName}".master_skus ms ON ms.id = i.master_sku_id
       LEFT JOIN "${schemaName}".warehouses w ON w.id = i.warehouse_id
       WHERE i.warehouse_id = $1`,
      [warehouseId],
    );

    return results.map((row) => this.mapToInventoryItem(row));
  }

  async getAllInventory(schemaName: string): Promise<InventoryItem[]> {
    const res = await this.getInventory(
      { page: 1, limit: 1000, offset: 0 },
      schemaName,
    );
    return Array.isArray(res) ? res : res.data;
  }

  async adjustStock(
    adjustStockDto: AdjustStockDto,
    userId: string,
    schemaName: string,
  ): Promise<InventoryItem> {
    const { masterSkuId, warehouseId, quantity, reason } = adjustStockDto;
    const idempotencyKey = adjustStockDto.idempotencyKey;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const priorMovement = (await queryRunner.query(
        `SELECT inventory_id FROM "${schemaName}".inventory_movements
         WHERE idempotency_key = $1`,
        [idempotencyKey],
      )) as Array<{ inventory_id: string }>;
      if (priorMovement.length > 0) {
        const priorInventory = (await queryRunner.query(
          `SELECT * FROM "${schemaName}".inventory WHERE id = $1`,
          [priorMovement[0].inventory_id],
        )) as InventoryRow[];
        if (priorInventory.length === 0) {
          throw new NotFoundException('Inventory record not found');
        }
        await queryRunner.commitTransaction();
        return this.mapToInventoryItem(priorInventory[0]);
      }

      const existing = (await queryRunner.query(
        `SELECT * FROM "${schemaName}".inventory
         WHERE master_sku_id = $1 AND warehouse_id = $2 FOR UPDATE`,
        [masterSkuId, warehouseId],
      )) as InventoryRow[];
      const result =
        existing.length === 0
          ? await this.createInventoryRecord(
              schemaName,
              adjustStockDto,
              queryRunner,
            )
          : await this.updateInventoryQuantity(
              schemaName,
              existing[0],
              quantity,
              queryRunner,
            );

      await queryRunner.query(
        `INSERT INTO "${schemaName}".inventory_movements
         (inventory_id, master_sku_id, warehouse_id, movement_type, quantity_delta, reserved_delta, idempotency_key, actor_user_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          result.id,
          masterSkuId,
          warehouseId,
          quantity >= 0 ? 'ADJUST_ADD' : 'ADJUST_SUBTRACT',
          quantity,
          0,
          idempotencyKey,
          userId,
          JSON.stringify({ reason }),
        ],
      );

      await this.logAudit(
        userId,
        'ADJUST',
        'inventory',
        result.id,
        { masterSkuId, warehouseId, quantity, reason },
        schemaName,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      await this.notifyIfLowStock(result, schemaName);
      return this.mapToInventoryItem(result);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reserveManualStock(
    reserveStockDto: ReserveStockDto,
    userId: string,
    schemaName: string,
  ): Promise<InventoryItem> {
    const { masterSkuId, warehouseId, quantity } = reserveStockDto;
    const idempotencyKey = reserveStockDto.idempotencyKey;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const priorMovement = (await queryRunner.query(
        `SELECT inventory_id FROM "${schemaName}".inventory_movements
         WHERE idempotency_key = $1`,
        [idempotencyKey],
      )) as Array<{ inventory_id: string }>;
      if (priorMovement.length > 0) {
        const priorInventory = (await queryRunner.query(
          `SELECT * FROM "${schemaName}".inventory WHERE id = $1`,
          [priorMovement[0].inventory_id],
        )) as InventoryRow[];
        if (priorInventory.length === 0) {
          throw new NotFoundException('Inventory record not found');
        }
        await queryRunner.commitTransaction();
        return this.mapToInventoryItem(priorInventory[0]);
      }

      const rows = (await queryRunner.query(
        `SELECT * FROM "${schemaName}".inventory
         WHERE master_sku_id = $1 AND warehouse_id = $2 FOR UPDATE`,
        [masterSkuId, warehouseId],
      )) as InventoryRow[];
      if (rows.length === 0) {
        throw new BadRequestException('No inventory available to reserve');
      }

      const row = rows[0];
      const available =
        Number(row.quantity) -
        Number(row.reserved_quantity) -
        Number(row.safety_stock);
      if (available < quantity) {
        throw new BadRequestException(
          `Insufficient stock to reserve: requested ${quantity}, available ${available}`,
        );
      }

      const updated = (await queryRunner.query(
        `UPDATE "${schemaName}".inventory
         SET reserved_quantity = reserved_quantity + $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [quantity, row.id],
      )) as InventoryRow[];

      await queryRunner.query(
        `INSERT INTO "${schemaName}".inventory_movements
         (inventory_id, master_sku_id, warehouse_id, movement_type, quantity_delta, reserved_delta, idempotency_key, actor_user_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          row.id,
          masterSkuId,
          warehouseId,
          'RESERVE',
          0,
          quantity,
          idempotencyKey,
          userId,
          JSON.stringify({}),
        ],
      );

      await this.logAudit(
        userId,
        'RESERVE',
        'inventory',
        row.id,
        { masterSkuId, warehouseId, quantity },
        schemaName,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return this.mapToInventoryItem(updated[0]);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reserveStock(
    reservation: ReservationInput,
    schemaName: string,
    executor: QueryExecutor = this.dataSource,
  ): Promise<InventoryItem> {
    const { masterSkuId, warehouseId, quantity } = reservation;

    const result = await executor.query<InventoryRow[]>(
      `UPDATE "${schemaName}".inventory
       SET reserved_quantity = reserved_quantity + $1, updated_at = NOW()
       WHERE master_sku_id = $2
         AND warehouse_id = $3
         AND quantity - reserved_quantity - safety_stock >= $1
       RETURNING *`,
      [quantity, masterSkuId, warehouseId],
    );

    if (result.length === 0) {
      const existing = await executor.query<InventoryRow[]>(
        `SELECT quantity, reserved_quantity, safety_stock
         FROM "${schemaName}".inventory
         WHERE master_sku_id = $1 AND warehouse_id = $2`,
        [masterSkuId, warehouseId],
      );

      if (existing.length === 0) {
        throw new BadRequestException('No inventory available to reserve');
      }

      const available =
        Number(existing[0].quantity) -
        Number(existing[0].reserved_quantity) -
        Number(existing[0].safety_stock);
      throw new BadRequestException(
        `Insufficient stock to reserve: requested ${quantity}, available ${available}`,
      );
    }

    return this.mapToInventoryItem(result[0]);
  }

  async releaseStock(
    reservationOrSku: ReservationInput | string,
    warehouseIdOrSchema: string,
    quantityOrExecutor?: number | QueryExecutor,
    schemaName?: string,
    executor: QueryExecutor = this.dataSource,
  ): Promise<InventoryItem> {
    let masterSkuId: string;
    let warehouseId: string;
    let quantity: number;
    let effectiveSchema: string;
    let effectiveExecutor: QueryExecutor;

    if (typeof reservationOrSku === 'object') {
      masterSkuId = reservationOrSku.masterSkuId;
      warehouseId = reservationOrSku.warehouseId;
      quantity = reservationOrSku.quantity;
      effectiveSchema = warehouseIdOrSchema;
      effectiveExecutor = (quantityOrExecutor as QueryExecutor) || this.dataSource;
    } else {
      masterSkuId = reservationOrSku;
      warehouseId = warehouseIdOrSchema;
      quantity = quantityOrExecutor as number;
      effectiveSchema = schemaName!;
      effectiveExecutor = executor;
    }

    const result = (await effectiveExecutor.query(
      `UPDATE "${effectiveSchema}".inventory
       SET reserved_quantity = GREATEST(0, reserved_quantity - $1), updated_at = NOW()
       WHERE master_sku_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [quantity, masterSkuId, warehouseId],
    )) as InventoryRow[];

    if (result.length === 0) {
      throw new NotFoundException('Inventory record not found');
    }

    return this.mapToInventoryItem(result[0]);
  }

  async releaseReservation(
    masterSkuId: string,
    warehouseId: string,
    quantity: number,
    schemaName: string,
    executor: QueryExecutor = this.dataSource,
  ): Promise<InventoryItem> {
    return this.releaseStock(
      masterSkuId,
      warehouseId,
      quantity,
      schemaName,
      executor,
    );
  }

  async deductStock(
    reservationOrSku: ReservationInput | string,
    warehouseIdOrSchema: string,
    quantityOrExecutor?: number | QueryExecutor,
    userIdOrSchema?: string,
    schemaName?: string,
    executor: QueryExecutor = this.dataSource,
  ): Promise<InventoryItem> {
    let masterSkuId: string;
    let warehouseId: string;
    let quantity: number;
    let effectiveSchema: string;
    let effectiveExecutor: QueryExecutor;

    if (typeof reservationOrSku === 'object') {
      masterSkuId = reservationOrSku.masterSkuId;
      warehouseId = reservationOrSku.warehouseId;
      quantity = reservationOrSku.quantity;
      effectiveSchema = warehouseIdOrSchema;
      effectiveExecutor = (quantityOrExecutor as QueryExecutor) || this.dataSource;
    } else {
      masterSkuId = reservationOrSku;
      warehouseId = warehouseIdOrSchema;
      quantity = quantityOrExecutor as number;
      effectiveSchema = schemaName || userIdOrSchema!;
      effectiveExecutor = executor;
    }

    const result = (await effectiveExecutor.query(
      `UPDATE "${effectiveSchema}".inventory
       SET quantity = GREATEST(0, quantity - $1),
           reserved_quantity = GREATEST(0, reserved_quantity - $1),
           updated_at = NOW()
       WHERE master_sku_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [quantity, masterSkuId, warehouseId],
    )) as InventoryRow[];

    if (result.length === 0) {
      throw new NotFoundException('Inventory record not found');
    }

    await this.notifyIfLowStock(result[0], effectiveSchema);
    return this.mapToInventoryItem(result[0]);
  }

  async restockStock(
    reservationOrSku: ReservationInput | string,
    warehouseIdOrSchema: string,
    quantityOrExecutor?: number | QueryExecutor,
    schemaName?: string,
    executor: QueryExecutor = this.dataSource,
  ): Promise<InventoryItem> {
    let masterSkuId: string;
    let warehouseId: string;
    let quantity: number;
    let effectiveSchema: string;
    let effectiveExecutor: QueryExecutor;

    if (typeof reservationOrSku === 'object') {
      masterSkuId = reservationOrSku.masterSkuId;
      warehouseId = reservationOrSku.warehouseId;
      quantity = reservationOrSku.quantity;
      effectiveSchema = warehouseIdOrSchema;
      effectiveExecutor = (quantityOrExecutor as QueryExecutor) || this.dataSource;
    } else {
      masterSkuId = reservationOrSku;
      warehouseId = warehouseIdOrSchema;
      quantity = quantityOrExecutor as number;
      effectiveSchema = schemaName!;
      effectiveExecutor = executor;
    }

    const result = (await effectiveExecutor.query(
      `UPDATE "${effectiveSchema}".inventory
       SET quantity = quantity + $1, updated_at = NOW()
       WHERE master_sku_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [quantity, masterSkuId, warehouseId],
    )) as InventoryRow[];

    if (result.length === 0) {
      throw new NotFoundException('Inventory record not found');
    }

    return this.mapToInventoryItem(result[0]);
  }

  private async createInventoryRecord(
    schemaName: string,
    dto: AdjustStockDto,
    executor: QueryExecutor,
  ): Promise<InventoryRow> {
    const { masterSkuId, warehouseId, quantity } = dto;

    if (quantity < 0) {
      throw new BadRequestException('Initial inventory quantity cannot be negative');
    }

    const result = (await executor.query(
      `INSERT INTO "${schemaName}".inventory
       (master_sku_id, warehouse_id, quantity, reserved_quantity, safety_stock)
       VALUES ($1, $2, $3, 0, 0)
       RETURNING *`,
      [masterSkuId, warehouseId, quantity],
    )) as InventoryRow[];

    return result[0];
  }

  private async updateInventoryQuantity(
    schemaName: string,
    current: InventoryRow,
    adjustment: number,
    executor: QueryExecutor,
  ): Promise<InventoryRow> {
    const { master_sku_id: masterSkuId, warehouse_id: warehouseId } = current;
    const currentQty = Number(current.quantity);
    const reservedQty = Number(current.reserved_quantity);
    const newQty = currentQty + adjustment;

    if (newQty < 0) {
      throw new BadRequestException('Inventory quantity cannot be negative');
    }

    if (newQty < reservedQty) {
      throw new BadRequestException(
        `Quantity (${newQty}) cannot be less than reserved quantity (${reservedQty})`,
      );
    }

    const result = await executor.query<InventoryRow[]>(
      `UPDATE "${schemaName}".inventory
       SET quantity = $1, updated_at = NOW()
       WHERE master_sku_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [newQty, masterSkuId, warehouseId],
    );

    return result[0];
  }

  private async logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    changes: unknown,
    schemaName: string,
    executor: QueryExecutor = this.dataSource,
  ): Promise<void> {
    await executor.query(
      `INSERT INTO "${schemaName}".audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entityType, entityId, JSON.stringify(changes)],
    );
  }

  private mapToInventoryItem(row: InventoryRow): InventoryItem {
    const quantity = Number(row.quantity);
    const reservedQuantity = Number(row.reserved_quantity);
    const safetyStock = Number(row.safety_stock || 0);
    const availableQuantity = Math.max(0, quantity - reservedQuantity - safetyStock);

    return {
      id: row.id,
      masterSkuId: row.master_sku_id,
      warehouseId: row.warehouse_id,
      quantity,
      reservedQuantity,
      safetyStock,
      availableQuantity,
      ats: availableQuantity,
      skuCode: row.sku_code,
      productName: row.product_name,
      warehouseName: row.warehouse_name,
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at
          : new Date(row.updated_at),
    };
  }

  private mapToMovementItem(row: MovementRow): InventoryMovementItem {
    return {
      id: row.id,
      inventoryId: row.inventory_id,
      masterSkuId: row.master_sku_id,
      skuCode: row.sku_code,
      productName: row.product_name,
      warehouseId: row.warehouse_id,
      warehouseName: row.warehouse_name,
      orderId: row.order_id ?? undefined,
      movementType: row.movement_type,
      quantityDelta: Number(row.quantity_delta),
      reservedDelta: Number(row.reserved_delta),
      idempotencyKey: row.idempotency_key,
      actorUserId: row.actor_user_id ?? undefined,
      metadata:
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata ?? undefined,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at
          : new Date(row.created_at),
    };
  }

  private async notifyIfLowStock(
    row: InventoryRow,
    schemaName: string,
  ): Promise<void> {
    if (!this.notificationsService) return;
    const qty = Number(row.quantity);
    const reserved = Number(row.reserved_quantity);
    const safety = Number(row.safety_stock || 0);

    if (qty - reserved <= safety) {
      const today = new Date().toISOString().split('T')[0];
      const sku = row.sku_code || row.master_sku_id;
      const dedupeKey = `LOW_STOCK:${sku}:${row.warehouse_id}:${today}`;
      try {
        await this.notificationsService.create(
          {
            type: NotificationType.LOW_STOCK,
            severity:
              qty - reserved <= 0
                ? NotificationSeverity.CRITICAL
                : NotificationSeverity.WARNING,
            title: `Cảnh báo tồn kho thấp: SKU ${sku}`,
            body: `Tồn kho khả dụng của SKU ${sku} tại kho ${
              row.warehouse_name || row.warehouse_id
            } chỉ còn ${qty - reserved} (mức an toàn: ${safety}).`,
            link: '/inventory',
            dedupeKey,
          },
          schemaName,
        );
      } catch {
        // Suppress notification dispatch errors to preserve transaction integrity
      }
    }
  }
}
