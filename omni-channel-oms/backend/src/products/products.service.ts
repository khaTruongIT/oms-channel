import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductPublicMetadata } from './dto/product-public-metadata.dto';

export interface MasterSku {
  id: string;
  skuCode: string;
  productName: string;
  categoryId?: string;
  categoryName?: string;
  variants?: any;
  costPrice?: number;
  publicMetadata?: ProductPublicMetadata;
  createdAt: Date;
  deletedAt?: Date;
}

@Injectable()
export class ProductsService {
  constructor(private readonly dataSource: DataSource) {}

  async createProduct(
    createProductDto: CreateProductDto,
    schemaName: string,
  ): Promise<MasterSku> {
    const {
      skuCode,
      productName,
      variants,
      costPrice,
      categoryId,
      categoryName,
      publicMetadata,
    } = createProductDto;

    // Resolve Category ID
    let finalCategoryId = categoryId;

    if (!finalCategoryId && categoryName) {
      // Check if category exists by name
      const existingCategory = await this.dataSource.query(
        `SELECT id FROM "${schemaName}".categories WHERE name = $1`,
        [categoryName],
      );

      if (existingCategory.length > 0) {
        finalCategoryId = existingCategory[0].id;
      } else {
        // Create new category
        const newCategory = await this.dataSource.query(
          `INSERT INTO "${schemaName}".categories (name) VALUES ($1) RETURNING id`,
          [categoryName],
        );
        finalCategoryId = newCategory[0].id;
      }
    } else if (finalCategoryId) {
      // Verify category exists
      const existingCategory = await this.dataSource.query(
        `SELECT id FROM "${schemaName}".categories WHERE id = $1`,
        [finalCategoryId],
      );

      if (existingCategory.length === 0) {
        throw new NotFoundException('Category not found');
      }
    }

    // Check if SKU already exists
    const existing = await this.dataSource.query(
      `SELECT id FROM "${schemaName}".master_skus WHERE sku_code = $1 AND deleted_at IS NULL`,
      [skuCode],
    );

    if (existing.length > 0) {
      throw new ConflictException('SKU code already exists');
    }

    const result = await this.dataSource.query(
      `INSERT INTO "${schemaName}".master_skus (sku_code, product_name, variants, cost_price, category_id, public_metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        skuCode,
        productName,
        variants ? JSON.stringify(variants) : null,
        costPrice,
        finalCategoryId,
        publicMetadata ?? null,
      ],
    );

    // Fetch full product with category name
    return this.getProductById(result[0].id, schemaName);
  }

  async getAllProducts(schemaName: string): Promise<MasterSku[]> {
    const results = await this.dataSource.query(
      `SELECT m.*, c.name as category_name 
       FROM "${schemaName}".master_skus m
       LEFT JOIN "${schemaName}".categories c ON m.category_id = c.id
       WHERE m.deleted_at IS NULL 
       ORDER BY m.created_at DESC`,
    );

    return results.map(this.mapToMasterSku);
  }

  async getProductById(id: string, schemaName: string): Promise<MasterSku> {
    const result = await this.dataSource.query(
      `SELECT m.*, c.name as category_name
       FROM "${schemaName}".master_skus m
       LEFT JOIN "${schemaName}".categories c ON m.category_id = c.id
       WHERE m.id = $1 AND m.deleted_at IS NULL`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Product not found');
    }

    return this.mapToMasterSku(result[0]);
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    schemaName: string,
  ): Promise<MasterSku> {
    const {
      productName,
      variants,
      costPrice,
      categoryId,
      categoryName,
      publicMetadata,
    } = updateProductDto;

    // Check if product exists
    await this.getProductById(id, schemaName);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (productName !== undefined) {
      updates.push(`product_name = $${paramIndex++}`);
      values.push(productName);
    }

    if (variants !== undefined) {
      updates.push(`variants = $${paramIndex++}`);
      values.push(JSON.stringify(variants));
    }

    if (costPrice !== undefined) {
      updates.push(`cost_price = $${paramIndex++}`);
      values.push(costPrice);
    }

    let finalCategoryId = categoryId;
    if (categoryName !== undefined) {
      const existingCategory = await this.dataSource.query(
        `SELECT id FROM "${schemaName}".categories WHERE name = $1`,
        [categoryName],
      );

      if (existingCategory.length > 0) {
        finalCategoryId = existingCategory[0].id;
      } else {
        const newCategory = await this.dataSource.query(
          `INSERT INTO "${schemaName}".categories (name) VALUES ($1) RETURNING id`,
          [categoryName],
        );
        finalCategoryId = newCategory[0].id;
      }
    }

    if (finalCategoryId !== undefined) {
      // Verify category exists if not null
      if (finalCategoryId) {
        const existingCategory = await this.dataSource.query(
          `SELECT id FROM "${schemaName}".categories WHERE id = $1`,
          [finalCategoryId],
        );
        if (existingCategory.length === 0) {
          throw new NotFoundException('Category not found');
        }
      }
      updates.push(`category_id = $${paramIndex++}`);
      values.push(finalCategoryId);
    }

    if (publicMetadata !== undefined) {
      updates.push(`public_metadata = $${paramIndex++}`);
      values.push(publicMetadata);
    }

    if (updates.length === 0) {
      return this.getProductById(id, schemaName);
    }

    values.push(id);

    const result = await this.dataSource.query(
      `UPDATE "${schemaName}".master_skus
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING *`,
      values,
    );

    // Fetch full updated product
    return this.getProductById(id, schemaName);
  }

  async deleteProduct(id: string, schemaName: string): Promise<void> {
    // Soft delete
    const result = await this.dataSource.query(
      `UPDATE "${schemaName}".master_skus
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Product not found');
    }
  }

  private mapToMasterSku(row: any): MasterSku {
    return {
      id: row.id,
      skuCode: row.sku_code,
      productName: row.product_name,
      categoryId: row.category_id,
      categoryName: row.category_name, // Mapped from join
      variants: row.variants,
      costPrice: row.cost_price ? parseFloat(row.cost_price) : undefined,
      publicMetadata: this.mapPublicMetadata(row.public_metadata),
      createdAt: row.created_at,
      deletedAt: row.deleted_at,
    };
  }

  private mapPublicMetadata(value: unknown): ProductPublicMetadata | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as ProductPublicMetadata;
      } catch {
        return undefined;
      }
    }

    if (typeof value === 'object') {
      return value as ProductPublicMetadata;
    }

    return undefined;
  }
}
