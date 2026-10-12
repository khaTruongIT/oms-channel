import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CustomerRecord,
  CustomerWithRecentOrders,
  CustomerOrderSummary,
} from './entities/customer.entity';
import { QueryCustomersDto } from './dto/query-customers.dto';

export interface PaginatedCustomers {
  items: Array<{
    id: string;
    fullName: string;
    phone: string;
    rawPhone?: string | null;
    email?: string | null;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt?: Date | string | null;
    createdAt: Date | string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class CustomersService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(
    query: QueryCustomersDto,
    schemaName: string,
  ): Promise<PaginatedCustomers> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (query.q && query.q.trim()) {
      params.push(`%${query.q.trim()}%`);
      const pIdx = params.length;
      conditions.push(
        `(full_name ILIKE $${pIdx} OR phone ILIKE $${pIdx} OR raw_phone ILIKE $${pIdx})`,
      );
    }

    const whereClause = conditions.join(' AND ');

    // Validate safe sort columns
    const safeSortColumns = [
      'total_spent',
      'total_orders',
      'created_at',
      'last_order_at',
    ];
    const sortBy = safeSortColumns.includes(query.sortBy || '')
      ? query.sortBy!
      : 'total_spent';
    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const countSql = `
      SELECT COUNT(*) AS count
      FROM "${schemaName}".customers
      WHERE ${whereClause}
    `;
    const countResult = await this.dataSource.query(countSql, params);
    const total = Number(countResult[0]?.count || 0);

    // Items query
    const itemsSql = `
      SELECT *
      FROM "${schemaName}".customers
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder} NULLS LAST
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const items = (await this.dataSource.query(itemsSql, [
      ...params,
      limit,
      offset,
    ])) as CustomerRecord[];

    return {
      items: items.map((c) => ({
        id: c.id,
        fullName: c.full_name,
        phone: c.phone,
        rawPhone: c.raw_phone,
        email: c.email,
        totalOrders: Number(c.total_orders || 0),
        totalSpent: Number(c.total_spent || 0),
        lastOrderAt: c.last_order_at,
        createdAt: c.created_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(
    id: string,
    schemaName: string,
  ): Promise<CustomerWithRecentOrders> {
    const customerRows = (await this.dataSource.query(
      `SELECT * FROM "${schemaName}".customers WHERE id = $1 LIMIT 1`,
      [id],
    )) as CustomerRecord[];

    if (customerRows.length === 0) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    const customer = customerRows[0];

    const orderRows = (await this.dataSource.query(
      `SELECT id, order_number, channel, status, total_amount, created_at
       FROM "${schemaName}".orders
       WHERE customer_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id],
    )) as Array<{
      id: string;
      order_number: string;
      channel: string;
      status: string;
      total_amount: string | number;
      created_at: Date;
    }>;

    const recentOrders: CustomerOrderSummary[] = orderRows.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      channel: o.channel,
      status: o.status,
      totalAmount: Number(o.total_amount || 0),
      createdAt: o.created_at,
    }));

    return {
      id: customer.id,
      fullName: customer.full_name,
      phone: customer.phone,
      rawPhone: customer.raw_phone,
      email: customer.email,
      totalOrders: Number(customer.total_orders || 0),
      totalSpent: Number(customer.total_spent || 0),
      lastOrderAt: customer.last_order_at,
      createdAt: customer.created_at,
      recentOrders,
    };
  }
}
