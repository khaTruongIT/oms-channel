import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ReserveStockDto } from './dto/reserve-stock.dto';

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

@Injectable()
export class InventoryService {
  constructor(private readonly dataSource: DataSource) {}

  async getInventoryByProduct(
    masterSkuId: string,
    schemaName: string,
  ): Promise<InventoryItem[]> {
    const results = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".inventory WHERE master_sku_id = $1`,
      [masterSkuId],
    );

    return results.map(this.mapToInventoryItem);
  }

  async getInventoryByWarehouse(
    warehouseId: string,
    schemaName: string,
  ): Promise<InventoryItem[]> {
    const results = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".inventory WHERE warehouse_id = $1`,
      [warehouseId],
    );

    return results.map(this.mapToInventoryItem);
  }

  async getAllInventory(schemaName: string): Promise<InventoryItem[]> {
    const results = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".inventory ORDER BY updated_at DESC`,
    );

    return results.map(this.mapToInventoryItem);
  }

  async adjustStock(
    adjustStockDto: AdjustStockDto,
    userId: string,
    schemaName: string,
  ): Promise<InventoryItem> {
    const { masterSkuId, warehouseId, quantity, reason } = adjustStockDto;

    // Check if inventory record exists
    const existing = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".inventory 
       WHERE master_sku_id = $1 AND warehouse_id = $2`,
      [masterSkuId, warehouseId],
    );

    let result;

    if (existing.length === 0) {
      // Create new inventory record
      if (quantity < 0) {
        throw new BadRequestException(
          'Cannot create inventory with negative quantity',
        );
      }

      result = await this.dataSource.query(
        `INSERT INTO "${schemaName}".inventory (master_sku_id, warehouse_id, quantity, reserved_quantity, safety_stock)
         VALUES ($1, $2, $3, 0, 0)
         RETURNING *`,
        [masterSkuId, warehouseId, quantity],
      );
    } else {
      // Update existing inventory
      const currentQty = existing[0].quantity;
      const newQty = currentQty + quantity;

      if (newQty < 0) {
        throw new BadRequestException('Insufficient stock for adjustment');
      }

      result = await this.dataSource.query(
        `UPDATE "${schemaName}".inventory
         SET quantity = $1, updated_at = NOW()
         WHERE master_sku_id = $2 AND warehouse_id = $3
         RETURNING *`,
        [newQty, masterSkuId, warehouseId],
      );
    }

    // Log the adjustment
    await this.logAudit(
      userId,
      'STOCK_ADJUSTMENT',
      'inventory',
      result[0].id,
      {
        masterSkuId,
        warehouseId,
        adjustment: quantity,
        reason,
        newQuantity: result[0].quantity,
      },
      schemaName,
    );

    return this.mapToInventoryItem(result[0]);
  }

  async reserveStock(
    reserveStockDto: ReserveStockDto,
    schemaName: string,
  ): Promise<InventoryItem> {
    const { masterSkuId, warehouseId, quantity } = reserveStockDto;

    // Get current inventory
    const existing = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".inventory 
       WHERE master_sku_id = $1 AND warehouse_id = $2`,
      [masterSkuId, warehouseId],
    );

    if (existing.length === 0) {
      throw new NotFoundException('Inventory record not found');
    }

    const current = existing[0];
    const availableQty = current.quantity - current.reserved_quantity;

    if (availableQty < quantity) {
      throw new BadRequestException(
        `Insufficient available stock. Available: ${availableQty}, Requested: ${quantity}`,
      );
    }

    // Reserve stock
    const result = await this.dataSource.query(
      `UPDATE "${schemaName}".inventory
       SET reserved_quantity = reserved_quantity + $1, updated_at = NOW()
       WHERE master_sku_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [quantity, masterSkuId, warehouseId],
    );

    return this.mapToInventoryItem(result[0]);
  }

  async releaseReservation(
    masterSkuId: string,
    warehouseId: string,
    quantity: number,
    schemaName: string,
  ): Promise<InventoryItem> {
    const result = await this.dataSource.query(
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
  ): Promise<InventoryItem> {
    // Get current inventory
    const existing = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".inventory 
       WHERE master_sku_id = $1 AND warehouse_id = $2`,
      [masterSkuId, warehouseId],
    );

    if (existing.length === 0) {
      throw new NotFoundException('Inventory record not found');
    }

    const current = existing[0];

    if (current.reserved_quantity < quantity) {
      throw new BadRequestException('Insufficient reserved stock');
    }

    // Deduct from both quantity and reserved_quantity
    const result = await this.dataSource.query(
      `UPDATE "${schemaName}".inventory
       SET quantity = quantity - $1,
           reserved_quantity = reserved_quantity - $1,
           updated_at = NOW()
       WHERE master_sku_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [quantity, masterSkuId, warehouseId],
    );

    // Log the deduction
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
    );

    return this.mapToInventoryItem(result[0]);
  }

  private async logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    changes: any,
    schemaName: string,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO "${schemaName}".audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entityType, entityId, JSON.stringify(changes)],
    );
  }

  private mapToInventoryItem(row: any): InventoryItem {
    const quantity = parseInt(row.quantity);
    const reservedQuantity = parseInt(row.reserved_quantity);

    return {
      id: row.id,
      masterSkuId: row.master_sku_id,
      warehouseId: row.warehouse_id,
      quantity,
      reservedQuantity,
      safetyStock: parseInt(row.safety_stock),
      availableQuantity: quantity - reservedQuantity,
      updatedAt: row.updated_at,
    };
  }
}
