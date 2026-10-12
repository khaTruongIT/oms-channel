import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { ErrorCode } from '../common/errors/error-codes';

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

@Injectable()
export class WarehousesService {
  constructor(private readonly dataSource: DataSource) {}

  async createWarehouse(
    createWarehouseDto: CreateWarehouseDto,
    schemaName: string,
  ): Promise<Warehouse> {
    const { name, location } = createWarehouseDto;

    const result = await this.dataSource.query(
      `INSERT INTO "${schemaName}".warehouses (name, location, is_active)
       VALUES ($1, $2, TRUE)
       RETURNING *`,
      [name, location],
    );

    return this.mapToWarehouse(result[0]);
  }

  async getAllWarehouses(schemaName: string): Promise<Warehouse[]> {
    const results = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".warehouses WHERE is_active = TRUE ORDER BY name`,
    );

    return results.map(this.mapToWarehouse);
  }

  async getWarehouseById(id: string, schemaName: string): Promise<Warehouse> {
    const result = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".warehouses WHERE id = $1 AND is_active = TRUE`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Warehouse not found');
    }

    return this.mapToWarehouse(result[0]);
  }

  async updateWarehouse(
    id: string,
    updateWarehouseDto: UpdateWarehouseDto,
    schemaName: string,
  ): Promise<Warehouse> {
    await this.getWarehouseById(id, schemaName);

    const { name, location } = updateWarehouseDto;

    const result = await this.dataSource.query(
      `UPDATE "${schemaName}".warehouses
       SET name = COALESCE($2, name),
           location = COALESCE($3, location)
       WHERE id = $1 AND is_active = TRUE
       RETURNING *`,
      [id, name ?? null, location ?? null],
    );

    return this.mapToWarehouse(result[0]);
  }

  async deleteWarehouse(id: string, schemaName: string): Promise<Warehouse> {
    await this.getWarehouseById(id, schemaName);

    const inventoryInWarehouse = await this.dataSource.query(
      `SELECT 1 FROM "${schemaName}".inventory
       WHERE warehouse_id = $1 AND (quantity > 0 OR reserved_quantity > 0)
       LIMIT 1`,
      [id],
    );

    if (inventoryInWarehouse.length > 0) {
      throw new ConflictException({
        code: ErrorCode.WAREHOUSE_IN_USE,
        message:
          'Warehouse cannot be deleted because it still contains inventory items',
      });
    }

    const activeOrdersInWarehouse = await this.dataSource.query(
      `SELECT 1 FROM "${schemaName}".order_items oi
       JOIN "${schemaName}".orders o ON o.id = oi.order_id
       WHERE oi.warehouse_id = $1 AND o.status NOT IN ('DELIVERED', 'CANCELLED')
       LIMIT 1`,
      [id],
    );

    if (activeOrdersInWarehouse.length > 0) {
      throw new ConflictException({
        code: ErrorCode.WAREHOUSE_IN_USE,
        message:
          'Warehouse cannot be deleted because it is assigned to open orders',
      });
    }

    const result = await this.dataSource.query(
      `UPDATE "${schemaName}".warehouses
       SET is_active = FALSE
       WHERE id = $1
       RETURNING *`,
      [id],
    );

    return this.mapToWarehouse(result[0]);
  }

  async getWarehouseSummary(
    id: string,
    schemaName: string,
  ): Promise<WarehouseSummary> {
    await this.getWarehouseById(id, schemaName);

    const result = await this.dataSource.query(
      `SELECT
         COUNT(DISTINCT i.master_sku_id) as total_skus,
         COALESCE(SUM(i.quantity), 0) as total_on_hand,
         COALESCE(SUM(i.reserved_quantity), 0) as total_reserved,
         COALESCE(SUM(GREATEST(0, i.quantity - i.reserved_quantity - i.safety_stock)), 0) as total_available,
         COALESCE(SUM(i.quantity * COALESCE(ms.cost_price, 0)), 0) as total_stock_value
       FROM "${schemaName}".inventory i
       LEFT JOIN "${schemaName}".master_skus ms ON ms.id = i.master_sku_id
       WHERE i.warehouse_id = $1`,
      [id],
    );

    const row = result[0] || {};
    return {
      warehouseId: id,
      totalSkus: Number(row.total_skus || 0),
      totalOnHand: Number(row.total_on_hand || 0),
      totalReserved: Number(row.total_reserved || 0),
      totalAvailable: Number(row.total_available || 0),
      totalStockValue: Number(row.total_stock_value || 0),
    };
  }

  private mapToWarehouse(row: any): Warehouse {
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      isActive: row.is_active,
    };
  }
}

export interface WarehouseSummary {
  warehouseId: string;
  totalSkus: number;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  totalStockValue: number;
}

