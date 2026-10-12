import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SearchQueryDto } from './dto/search-query.dto';

export interface SearchItem {
  id: string;
  type: 'product' | 'order' | 'customer';
  title: string;
  subtitle: string;
  url: string;
}

export interface SearchResponse {
  query: string;
  items: SearchItem[];
  total: number;
}

export function escapeIlikePattern(raw: string): string {
  // Escape backslash first, then % and _
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

@Injectable()
export class SearchService {
  constructor(private readonly dataSource: DataSource) {}

  async search(
    queryDto: SearchQueryDto,
    schemaName: string,
  ): Promise<SearchResponse> {
    const rawQ = queryDto.q ? queryDto.q.trim() : '';

    if (rawQ.length < 2) {
      throw new BadRequestException('Từ khóa tìm kiếm phải có tối thiểu 2 ký tự');
    }

    const escaped = escapeIlikePattern(rawQ);
    const pattern = `%${escaped}%`;

    const requestedTypes = queryDto.types
      ? queryDto.types
          .toLowerCase()
          .split(',')
          .map((t) => t.trim())
      : ['products', 'orders', 'customers'];

    const items: SearchItem[] = [];

    // 1. Search Products (master_skus)
    if (requestedTypes.includes('products') || requestedTypes.includes('product')) {
      const productRows = (await this.dataSource.query(
        `SELECT id, sku_code, product_name
         FROM "${schemaName}".master_skus
         WHERE (sku_code ILIKE $1 ESCAPE '\\' OR product_name ILIKE $1 ESCAPE '\\')
           AND deleted_at IS NULL
         ORDER BY
           CASE WHEN sku_code ILIKE $1 ESCAPE '\\' THEN 1 ELSE 2 END,
           created_at DESC
         LIMIT 5`,
        [pattern],
      )) as Array<{
        id: string;
        sku_code: string;
        product_name: string;
      }>;

      for (const p of productRows) {
        items.push({
          id: p.id,
          type: 'product',
          title: p.product_name || p.sku_code,
          subtitle: `SKU: ${p.sku_code}`,
          url: `/products/${p.id}`,
        });
      }
    }

    // 2. Search Orders
    if (requestedTypes.includes('orders') || requestedTypes.includes('order')) {
      const orderRows = (await this.dataSource.query(
        `SELECT id, order_number, channel, customer_name, status, total_amount
         FROM "${schemaName}".orders
         WHERE (order_number ILIKE $1 ESCAPE '\\'
            OR customer_name ILIKE $1 ESCAPE '\\'
            OR external_order_id ILIKE $1 ESCAPE '\\')
         ORDER BY created_at DESC
         LIMIT 5`,
        [pattern],
      )) as Array<{
        id: string;
        order_number: string;
        channel: string;
        customer_name?: string | null;
        status: string;
        total_amount: string | number;
      }>;

      for (const o of orderRows) {
        items.push({
          id: o.id,
          type: 'order',
          title: `Đơn hàng #${o.order_number}`,
          subtitle: `${o.status} • ${o.customer_name || o.channel}`,
          url: `/orders/${o.id}`,
        });
      }
    }

    // 3. Search Customers
    if (requestedTypes.includes('customers') || requestedTypes.includes('customer')) {
      const customerRows = (await this.dataSource.query(
        `SELECT id, full_name, phone, raw_phone, email, total_orders
         FROM "${schemaName}".customers
         WHERE (full_name ILIKE $1 ESCAPE '\\'
            OR phone ILIKE $1 ESCAPE '\\'
            OR raw_phone ILIKE $1 ESCAPE '\\')
         ORDER BY total_spent DESC
         LIMIT 5`,
        [pattern],
      )) as Array<{
        id: string;
        full_name: string;
        phone: string;
        raw_phone?: string | null;
        email?: string | null;
        total_orders: number;
      }>;

      for (const c of customerRows) {
        items.push({
          id: c.id,
          type: 'customer',
          title: c.full_name,
          subtitle: `${c.phone}${c.email ? ' • ' + c.email : ''} (${c.total_orders} đơn)`,
          url: `/customers/${c.id}`,
        });
      }
    }

    return {
      query: rawQ,
      items,
      total: items.length,
    };
  }
}
