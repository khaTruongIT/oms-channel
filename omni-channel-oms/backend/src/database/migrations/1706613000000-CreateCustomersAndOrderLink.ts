import { MigrationInterface, QueryRunner } from 'typeorm';
import { normalizeVNPhone } from '../../common/utils/phone';

export class CreateCustomersAndOrderLink1706613000000 implements MigrationInterface {
  name = 'CreateCustomersAndOrderLink1706613000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenants = (await queryRunner.query(
      `SELECT schema_name FROM public.tenants WHERE schema_name IS NOT NULL`,
    )) as Array<{ schema_name: string }>;

    const schemas = new Set<string>();
    for (const t of tenants) {
      if (t.schema_name) {
        schemas.add(t.schema_name);
      }
    }

    for (const schema of schemas) {
      // 1. Create customers table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          raw_phone VARCHAR(50) NULL,
          email VARCHAR(255) NULL,
          total_orders INT NOT NULL DEFAULT 0,
          total_spent DECIMAL(15, 2) NOT NULL DEFAULT 0,
          last_order_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone
        ON "${schema}".customers(phone);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_customers_spent
        ON "${schema}".customers(total_spent DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_customers_last_order
        ON "${schema}".customers(last_order_at DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_customers_full_name
        ON "${schema}".customers(full_name);
      `);

      // 2. Add customer_id to orders table
      await queryRunner.query(`
        ALTER TABLE "${schema}".orders
        ADD COLUMN IF NOT EXISTS customer_id UUID NULL REFERENCES "${schema}".customers(id) ON DELETE SET NULL;
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_customer_id
        ON "${schema}".orders(customer_id);
      `);

      // 3. Backfill existing orders (S4.3.7)
      const existingOrders = (await queryRunner.query(`
        SELECT id, customer_name, customer_phone, total_amount, created_at
        FROM "${schema}".orders
        WHERE customer_phone IS NOT NULL AND customer_id IS NULL
        ORDER BY created_at ASC
      `)) as Array<{
        id: string;
        customer_name: string | null;
        customer_phone: string | null;
        total_amount: string | number | null;
        created_at: Date;
      }>;

      for (const order of existingOrders) {
        const normalized = normalizeVNPhone(order.customer_phone);
        if (!normalized) continue;

        const customerName = (order.customer_name || 'Khách hàng').trim();
        const orderAmount = Number(order.total_amount || 0);

        // Upsert customer
        const customerRows = (await queryRunner.query(
          `INSERT INTO "${schema}".customers
             (full_name, phone, raw_phone, total_orders, total_spent, last_order_at)
           VALUES ($1, $2, $3, 1, $4, $5)
           ON CONFLICT (phone)
           DO UPDATE SET
             total_orders = "${schema}".customers.total_orders + 1,
             total_spent = "${schema}".customers.total_spent + EXCLUDED.total_spent,
             last_order_at = GREATEST("${schema}".customers.last_order_at, EXCLUDED.last_order_at),
             updated_at = NOW()
           RETURNING id`,
          [
            customerName,
            normalized,
            order.customer_phone,
            orderAmount,
            order.created_at || new Date(),
          ],
        )) as Array<{ id: string }>;

        if (customerRows.length > 0) {
          await queryRunner.query(
            `UPDATE "${schema}".orders SET customer_id = $1 WHERE id = $2`,
            [customerRows[0].id, order.id],
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tenants = (await queryRunner.query(
      `SELECT schema_name FROM public.tenants WHERE schema_name IS NOT NULL`,
    )) as Array<{ schema_name: string }>;

    for (const t of tenants) {
      if (t.schema_name) {
        await queryRunner.query(`
          ALTER TABLE "${t.schema_name}".orders DROP COLUMN IF EXISTS customer_id;
        `);
        await queryRunner.query(`
          DROP TABLE IF EXISTS "${t.schema_name}".customers CASCADE;
        `);
      }
    }
  }
}
