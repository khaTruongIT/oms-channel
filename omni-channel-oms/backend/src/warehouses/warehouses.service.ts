import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';

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

  private mapToWarehouse(row: any): Warehouse {
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      isActive: row.is_active,
    };
  }
}
