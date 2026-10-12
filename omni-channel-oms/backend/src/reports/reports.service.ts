import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { TopSkusQueryDto } from './dto/top-skus-query.dto';

export interface SalesReportRow {
  period?: string;
  channel?: string;
  orders: number;
  sales: number;
}

export interface InventoryCategoryValuation {
  category: string;
  skuCount: number;
  available: number;
  reserved: number;
  lowStock: number;
  valuation: number;
}

export interface InventoryValueResponse {
  categories: InventoryCategoryValuation[];
  summary: {
    totalQuantity: number;
    totalReserved: number;
    totalValuation: number;
    totalSkus: number;
    lowStockCount: number;
  };
}

export interface TopSkuRow {
  masterSkuId: string;
  sku: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

@Injectable()
export class ReportsService {
  private readonly cache = new Map<string, { data: any; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly dataSource: DataSource) {}

  public clearCache(): void {
    this.cache.clear();
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setInCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }

  private validateDateRange(fromStr: string, toStr: string): { from: Date; to: Date } {
    const from = new Date(fromStr);
    const to = new Date(toStr);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new BadRequestException('Định dạng ngày tháng không hợp lệ (ISO 8601)');
    }

    if (from > to) {
      throw new BadRequestException('Thời gian bắt đầu (from) phải trước thời gian kết thúc (to)');
    }

    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      throw new BadRequestException('Khoảng thời gian báo cáo không được vượt quá 366 ngày');
    }

    return { from, to };
  }

  async getSalesReport(
    query: SalesReportQueryDto,
    schemaName: string,
  ): Promise<SalesReportRow[]> {
    const { from, to } = this.validateDateRange(query.from, query.to);
    const groupBy = query.groupBy === 'channel' ? 'channel' : 'day';

    const cacheKey = `${schemaName}:sales:${from.toISOString()}:${to.toISOString()}:${groupBy}`;
    const cached = this.getFromCache<SalesReportRow[]>(cacheKey);
    if (cached) return cached;

    let resultRows: SalesReportRow[] = [];

    if (groupBy === 'day') {
      const sql = `
        SELECT
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS period,
          COUNT(*)::int AS orders,
          COALESCE(SUM(total_amount), 0)::numeric AS sales
        FROM "${schemaName}".orders
        WHERE created_at >= $1 AND created_at <= $2 AND status != 'CANCELLED'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at) ASC;
      `;
      const rows = await this.dataSource.query(sql, [from, to]);
      resultRows = rows.map((r: any) => ({
        period: r.period,
        orders: Number(r.orders || 0),
        sales: Number(r.sales || 0),
      }));
    } else {
      const sql = `
        SELECT
          channel,
          COUNT(*)::int AS orders,
          COALESCE(SUM(total_amount), 0)::numeric AS sales
        FROM "${schemaName}".orders
        WHERE created_at >= $1 AND created_at <= $2 AND status != 'CANCELLED'
        GROUP BY channel
        ORDER BY sales DESC;
      `;
      const rows = await this.dataSource.query(sql, [from, to]);
      resultRows = rows.map((r: any) => ({
        channel: r.channel,
        orders: Number(r.orders || 0),
        sales: Number(r.sales || 0),
      }));
    }

    this.setInCache(cacheKey, resultRows);
    return resultRows;
  }

  async getInventoryValueReport(
    schemaName: string,
  ): Promise<InventoryValueResponse> {
    const cacheKey = `${schemaName}:inventory-value`;
    const cached = this.getFromCache<InventoryValueResponse>(cacheKey);
    if (cached) return cached;

    const sql = `
      SELECT
        COALESCE(c.name, 'Chưa phân loại') AS category_name,
        COUNT(DISTINCT m.id)::int AS sku_count,
        COALESCE(SUM(i.quantity), 0)::int AS total_quantity,
        COALESCE(SUM(i.reserved_quantity), 0)::int AS total_reserved,
        COALESCE(SUM(i.quantity * COALESCE(m.cost_price, 0)), 0)::numeric AS total_valuation,
        COUNT(DISTINCT CASE WHEN (COALESCE(i.quantity, 0) - COALESCE(i.reserved_quantity, 0)) <= COALESCE(i.safety_stock, 0) THEN m.id END)::int AS low_stock_count
      FROM "${schemaName}".master_skus m
      LEFT JOIN "${schemaName}".categories c ON c.id = m.category_id
      LEFT JOIN "${schemaName}".inventory i ON i.master_sku_id = m.id
      WHERE m.deleted_at IS NULL
      GROUP BY c.name
      ORDER BY total_valuation DESC;
    `;

    const rows = await this.dataSource.query(sql);

    let sumQty = 0;
    let sumReserved = 0;
    let sumValuation = 0;
    let sumSkus = 0;
    let sumLowStock = 0;

    const categories: InventoryCategoryValuation[] = rows.map((r: any) => {
      const qty = Number(r.total_quantity || 0);
      const res = Number(r.total_reserved || 0);
      const val = Number(r.total_valuation || 0);
      const skus = Number(r.sku_count || 0);
      const low = Number(r.low_stock_count || 0);

      sumQty += qty;
      sumReserved += res;
      sumValuation += val;
      sumSkus += skus;
      sumLowStock += low;

      return {
        category: r.category_name,
        skuCount: skus,
        available: Math.max(0, qty - res),
        reserved: res,
        lowStock: low,
        valuation: val,
      };
    });

    const response: InventoryValueResponse = {
      categories,
      summary: {
        totalQuantity: sumQty,
        totalReserved: sumReserved,
        totalValuation: sumValuation,
        totalSkus: sumSkus,
        lowStockCount: sumLowStock,
      },
    };

    this.setInCache(cacheKey, response);
    return response;
  }

  async getTopSkusReport(
    query: TopSkusQueryDto,
    schemaName: string,
  ): Promise<TopSkuRow[]> {
    const { from, to } = this.validateDateRange(query.from, query.to);
    const limit = Math.min(50, Math.max(1, query.limit || 10));

    const cacheKey = `${schemaName}:top-skus:${from.toISOString()}:${to.toISOString()}:${limit}`;
    const cached = this.getFromCache<TopSkuRow[]>(cacheKey);
    if (cached) return cached;

    const sql = `
      SELECT
        m.id AS master_sku_id,
        m.sku_code,
        m.product_name,
        SUM(oi.quantity)::int AS units_sold,
        SUM(oi.subtotal)::numeric AS revenue
      FROM "${schemaName}".order_items oi
      JOIN "${schemaName}".orders o ON o.id = oi.order_id
      JOIN "${schemaName}".master_skus m ON m.id = oi.master_sku_id
      WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.status != 'CANCELLED'
      GROUP BY m.id, m.sku_code, m.product_name
      ORDER BY revenue DESC
      LIMIT $3;
    `;

    const rows = await this.dataSource.query(sql, [from, to, limit]);

    const result: TopSkuRow[] = rows.map((r: any) => ({
      masterSkuId: r.master_sku_id,
      sku: r.sku_code,
      productName: r.product_name,
      unitsSold: Number(r.units_sold || 0),
      revenue: Number(r.revenue || 0),
    }));

    this.setInCache(cacheKey, result);
    return result;
  }
}
