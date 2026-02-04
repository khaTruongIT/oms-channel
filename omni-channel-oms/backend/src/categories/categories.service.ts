import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly dataSource: DataSource) {}

  async createCategory(
    createCategoryDto: CreateCategoryDto,
    schemaName: string,
  ): Promise<Category> {
    const { name, description } = createCategoryDto;

    // Check if category name already exists
    const existing = await this.dataSource.query(
      `SELECT id FROM "${schemaName}".categories WHERE name = $1`,
      [name],
    );

    if (existing.length > 0) {
      throw new ConflictException('Category with this name already exists');
    }

    const result = await this.dataSource.query(
      `INSERT INTO "${schemaName}".categories (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name, description],
    );

    return this.mapToCategory(result[0]);
  }

  async findAll(schemaName: string): Promise<Category[]> {
    const results = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".categories ORDER BY created_at DESC`,
    );

    return results.map(this.mapToCategory);
  }

  async findOne(id: string, schemaName: string): Promise<Category> {
    const result = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".categories WHERE id = $1`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Category not found');
    }

    return this.mapToCategory(result[0]);
  }

  async findByName(name: string, schemaName: string): Promise<Category | null> {
    const result = await this.dataSource.query(
      `SELECT * FROM "${schemaName}".categories WHERE name = $1`,
      [name],
    );

    if (result.length === 0) {
      return null;
    }

    return this.mapToCategory(result[0]);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    schemaName: string,
  ): Promise<Category> {
    const { name, description } = updateCategoryDto;

    // Check if category exists
    await this.findOne(id, schemaName);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return this.findOne(id, schemaName);
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    values.push(id);

    const result = await this.dataSource.query(
      `UPDATE "${schemaName}".categories
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values,
    );

    return this.mapToCategory(result[0]);
  }

  async remove(id: string, schemaName: string): Promise<void> {
    // Check if category is used by any product
    const products = await this.dataSource.query(
      `SELECT id FROM "${schemaName}".master_skus WHERE category_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id],
    );

    if (products.length > 0) {
      throw new ConflictException(
        'Cannot delete category because it is assigned to one or more products',
      );
    }

    const result = await this.dataSource.query(
      `DELETE FROM "${schemaName}".categories WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Category not found');
    }
  }

  private mapToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
