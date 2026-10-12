import { DataSource } from 'typeorm';
import { normalizeVNPhone } from '../common/utils/phone';

export interface BackfillSummary {
  schema: string;
  processedOrders: number;
  linkedOrders: number;
  upsertedCustomers: number;
}

export async function backfillCustomersForSchema(
  dataSource: DataSource,
  schema: string,
  batchSize = 100,
): Promise<BackfillSummary> {
  let processedOrders = 0;
  let linkedOrders = 0;
  let upsertedCustomers = 0;

  let offset = 0;
  while (true) {
    const orders = (await dataSource.query(
      `SELECT id, customer_name, customer_phone, total_amount, created_at
       FROM "${schema}".orders
       WHERE customer_phone IS NOT NULL
       ORDER BY created_at ASC
       LIMIT $1 OFFSET $2`,
      [batchSize, offset],
    )) as Array<{
      id: string;
      customer_name: string | null;
      customer_phone: string | null;
      total_amount: string | number | null;
      created_at: Date | string;
    }>;

    if (!orders || orders.length === 0) {
      break;
    }

    processedOrders += orders.length;

    for (const order of orders) {
      const normalizedPhone = normalizeVNPhone(order.customer_phone);
      if (!normalizedPhone) continue;

      const customerName = (order.customer_name || 'Khách hàng').trim();
      const orderAmount = Number(order.total_amount || 0);
      const createdAt = order.created_at instanceof Date ? order.created_at : new Date(order.created_at);

      // Upsert customer record
      const customerResult = (await dataSource.query(
        `INSERT INTO "${schema}".customers
           (full_name, phone, raw_phone, total_orders, total_spent, last_order_at)
         VALUES ($1, $2, $3, 1, $4, $5)
         ON CONFLICT (phone)
         DO UPDATE SET
           last_order_at = GREATEST("${schema}".customers.last_order_at, EXCLUDED.last_order_at),
           updated_at = NOW()
         RETURNING id`,
        [customerName, normalizedPhone, order.customer_phone, orderAmount, createdAt],
      )) as Array<{ id: string }>;

      if (customerResult && customerResult.length > 0) {
        const customerId = customerResult[0].id;
        upsertedCustomers++;

        await dataSource.query(
          `UPDATE "${schema}".orders
           SET customer_id = $1
           WHERE id = $2 AND (customer_id IS NULL OR customer_id != $1)`,
          [customerId, order.id],
        );
        linkedOrders++;
      }
    }

    offset += batchSize;
  }

  // Recalculate totals for consistency across runs
  await dataSource.query(`
    UPDATE "${schema}".customers c
    SET
      total_orders = stats.order_count,
      total_spent = stats.spent_sum,
      updated_at = NOW()
    FROM (
      SELECT
        customer_id,
        COUNT(*)::int AS order_count,
        COALESCE(SUM(total_amount), 0)::decimal AS spent_sum
      FROM "${schema}".orders
      WHERE customer_id IS NOT NULL
      GROUP BY customer_id
    ) stats
    WHERE c.id = stats.customer_id;
  `);

  return {
    schema,
    processedOrders,
    linkedOrders,
    upsertedCustomers,
  };
}

export async function runBackfill(
  dataSource: DataSource,
  targetSchema?: string,
): Promise<BackfillSummary[]> {
  const summaries: BackfillSummary[] = [];

  if (targetSchema) {
    const summary = await backfillCustomersForSchema(dataSource, targetSchema);
    summaries.push(summary);
    return summaries;
  }

  const tenants = (await dataSource.query(
    `SELECT schema_name FROM public.tenants WHERE schema_name IS NOT NULL`,
  )) as Array<{ schema_name: string }>;

  for (const tenant of tenants) {
    if (tenant.schema_name) {
      const summary = await backfillCustomersForSchema(dataSource, tenant.schema_name);
      summaries.push(summary);
    }
  }

  return summaries;
}
