import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ReserveStockDto } from './dto/reserve-stock.dto';

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
  updatedAt: Date;
}

interface InventoryRow {
  id: string;
  master_sku_id: string;
  warehouse_id: string;
  quantity: string | number;
  reserved_quantity: string | number;
  safety_stock: string | number;
  updated_at: Date | string;
}

interface ReservationInput {
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
}

@Injectable()
export class InventoryService {
  constructor(private readonly dataSource: DataSource) {}

  async getInventoryByProduct(
    masterSkuId: string,
    schemaName: string,
  ): Promise<InventoryItem[]> {
    const results = await this.dataSource.query<InventoryRow[]>(
      `SELECT * FROM "${schemaName}".inventory WHERE master_sku_id = $1`,
      [masterSkuId],
    );

    return results.map((row) => this.mapToInventoryItem(row));
  }

  async getInventoryByWarehouse(
    warehouseId: string,
    schemaName: string,
  ): Promise<InventoryItem[]> {
    const results = await this.dataSource.query<InventoryRow[]>(
      `SELECT * FROM "${schemaName}".inventory WHERE warehouse_id = $1`,
      [warehouseId],
    );

    return results.map((row) => this.mapToInventoryItem(row));
  }

  async getAllInventory(schemaName: string): Promise<InventoryItem[]> {
    const results = await this.dataSource.query<InventoryRow[]>(
      `SELECT * FROM "${schemaName}".inventory ORDER BY updated_at DESC`,
    );

    return results.map((row) => this.mapToInventoryItem(row));
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
              adjustStockDto,
              queryRunner,
            );

      await queryRunner.query(
        `INSERT INTO "${schemaName}".inventory_movements
         (inventory_id, master_sku_id, warehouse_id, movement_type, quantity_delta, reserved_delta, idempotency_key, actor_user_id, metadata)
         VALUES ($1, $2, $3, 'ADJUST', $4, 0, $5, $6, $7)`,
        [
          result.id,
          masterSkuId,
          warehouseId,
          quantity,
          idempotencyKey,
          userId,
          JSON.stringify({ reason: reason ?? null }),
        ],
      );
      await this.logAudit(
        userId,
        'STOCK_ADJUSTMENT',
        'inventory',
        result.id,
        {
          masterSkuId,
          warehouseId,
          adjustment: quantity,
          reason,
          newQuantity: result.quantity,
        },
        schemaName,
        queryRunner,
      );
      await queryRunner.commitTransaction();
      return this.mapToInventoryItem(result);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reserveStock(
    reserveStockDto: ReservationInput,
    schemaName: string,
    executor: QueryExecutor = this.dataSource,
  ): Promise<InventoryItem> {
    const { masterSkuId, warehouseId, quantity } = reserveStockDto;

    const result = await executor.query<InventoryRow[]>(
      `UPDATE "${schemaName}".inventory
       SET reserved_quantity = reserved_quantity + $1, updated_at = NOW()
       WHERE master_sku_id = $2 AND warehouse_id = $3
         AND quantity - reserved_quantity - safety_stock >= $1
       RETURNING *`,
      [quantity, masterSkuId, warehouseId],
    );

    if (result.length > 0) {
      return this.mapToInventoryItem(result[0]);
    }

    const existing = await executor.query<InventoryRow[]>(
      `SELECT * FROM "${schemaName}".inventory
       WHERE master_sku_id = $1 AND warehouse_id = $2`,
      [masterSkuId, warehouseId],
    );

    if (existing.length === 0) {
      throw new NotFoundException('Inventory record not found');
    }

    const availableQty =
      Number(existing[0].quantity) -
      Number(existing[0].reserved_quantity) -
      Number(existing[0].safety_stock);
    throw new BadRequestException(
      `Insufficient available stock. Available: ${availableQty}, Requested: ${quantity}`,
    );
  }

  async reserveManualStock(
    reserveStockDto: ReserveStockDto,
    userId: string,
    schemaName: string,
  ): Promise<InventoryItem> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const priorMovement = (await queryRunner.query(
        `SELECT inventory_id FROM "${schemaName}".inventory_movements
         WHERE idempotency_key = $1`,
        [reserveStockDto.idempotencyKey],
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

      const inventory = await this.reserveStock(
        reserveStockDto,
        schemaName,
        queryRunner,
      );
      await queryRunner.query(
        `INSERT INTO "${schemaName}".inventory_movements
         (inventory_id, master_sku_id, warehouse_id, movement_type, quantity_delta, reserved_delta, idempotency_key, actor_user_id, metadata)
         VALUES ($1, $2, $3, 'RESERVE', 0, $4, $5, $6, $7)`,
        [
          inventory.id,
          reserveStockDto.masterSkuId,
          reserveStockDto.warehouseId,
          reserveStockDto.quantity,
          reserveStockDto.idempotencyKey,
          userId,
          JSON.stringify({ source: 'manual-reservation' }),
        ],
      );
      await this.logAudit(
        userId,
        'STOCK_RESERVATION',
        'inventory',
        inventory.id,
        {
          masterSkuId: reserveStockDto.masterSkuId,
          warehouseId: reserveStockDto.warehouseId,
          reserved: reserveStockDto.quantity,
        },
        schemaName,
        queryRunner,
      );
      await queryRunner.commitTransaction();
      return inventory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async releaseReservation(
    masterSkuId: string,
    warehouseId: string,
    quantity: number,
    schemaName: string,
    executor: QueryExecutor = this.dataSource,
  ): Promise<InventoryItem> {
    const result = await executor.query<InventoryRow[]>(
      `UPDATE "${schemaName}".inventory
       SET reserved_quantity = GREATEST(0, reserved_quantity - $1), updated_at = NOW()
       WHERE master_sku_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [quantity, masterSkuId, warehouseId],
    );

    if (result.length === 0) {
      throw new NotFoundException('Inventory record not found');
    }

    return this.mapToInventoryItem(result[0]);
  }

  async deductStock(
    masterSkuId: string,
    warehouseId: string,
    quantity: number,
    userId: string,
    schemaName: string,
    executor: QueryExecutor = this.dataSource,
  ): Promise<InventoryItem> {
    const existing = await executor.query<InventoryRow[]>(
      `SELECT * FROM "${schemaName}".inventory
       WHERE master_sku_id = $1 AND warehouse_id = $2`,
      [masterSkuId, warehouseId],
    );

    if (existing.length === 0) {
      throw new NotFoundException('Inventory record not found');
    }

    if (Number(existing[0].reserved_quantity) < quantity) {
      throw new BadRequestException('Insufficient reserved stock');
    }

    const result = await executor.query<InventoryRow[]>(
      `UPDATE "${schemaName}".inventory
       SET quantity = quantity - $1,
           reserved_quantity = reserved_quantity - $1,
           updated_at = NOW()
       WHERE master_sku_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [quantity, masterSkuId, warehouseId],
    );

    await this.logAudit(
      userId,
      'STOCK_DEDUCTION',
      'inventory',
      result[0].id,
      {
        masterSkuId,
        warehouseId,
        deduction: quantity,
        newQuantity: result[0].quantity,
      },
      schemaName,
      executor,
    );

    return this.mapToInventoryItem(result[0]);
  }

  async restockStock(
    masterSkuId: string,
    warehouseId: string,
    quantity: number,
    schemaName: string,
    executor: QueryExecutor = this.dataSource,
  ): Promise<InventoryItem> {
    const result = await executor.query<InventoryRow[]>(
      `UPDATE "${schemaName}".inventory
       SET quantity = quantity + $1, updated_at = NOW()
       WHERE master_sku_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [quantity, masterSkuId, warehouseId],
    );

    if (result.length === 0) {
      throw new NotFoundException('Inventory record not found');
    }

    return this.mapToInventoryItem(result[0]);
  }

  private async createInventoryRecord(
    schemaName: string,
    adjustStockDto: AdjustStockDto,
    executor: QueryExecutor = this.dataSource,
  ): Promise<InventoryRow> {
    const { masterSkuId, warehouseId, quantity } = adjustStockDto;

    if (quantity < 0) {
      throw new BadRequestException(
        'Cannot create inventory with negative quantity',
      );
    }

    const result = await executor.query<InventoryRow[]>(
      `INSERT INTO "${schemaName}".inventory (master_sku_id, warehouse_id, quantity, reserved_quantity, safety_stock)
       VALUES ($1, $2, $3, 0, 0)
       RETURNING *`,
      [masterSkuId, warehouseId, quantity],
    );

    return result[0];
  }

  private async updateInventoryQuantity(
    schemaName: string,
    current: InventoryRow,
    adjustStockDto: AdjustStockDto,
    executor: QueryExecutor = this.dataSource,
  ): Promise<InventoryRow> {
    const { masterSkuId, warehouseId, quantity } = adjustStockDto;
    const newQty = Number(current.quantity) + quantity;

    if (newQty < 0 || newQty < Number(current.reserved_quantity)) {
      throw new BadRequestException('Insufficient stock for adjustment');
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

    return {
      id: row.id,
      masterSkuId: row.master_sku_id,
      warehouseId: row.warehouse_id,
      quantity,
      reservedQuantity,
      safetyStock: Number(row.safety_stock),
      availableQuantity: Math.max(
        0,
        quantity - reservedQuantity - Number(row.safety_stock),
      ),
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at
          : new Date(row.updated_at),
    };
  }
}
