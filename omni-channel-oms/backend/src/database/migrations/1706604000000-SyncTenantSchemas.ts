import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncTenantSchemas1706604000000 implements MigrationInterface {
  name = 'SyncTenantSchemas1706604000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Get all tenants
    const tenants = await queryRunner.query(
      `SELECT schema_name FROM public.tenants`,
    );

    // 2. Iterate and sync tables
    for (const tenant of tenants) {
      const schemaName = tenant.schema_name;

      // Ensure schema exists (just in case)
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      console.log(`Syncing schema for tenant: ${schemaName}`);

      // Categories
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(name)
        )
      `);

      // Master SKUs
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".master_skus (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sku_code VARCHAR(100) UNIQUE NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          category_id UUID REFERENCES "${schemaName}".categories(id),
          variants JSONB,
          cost_price DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT NOW(),
          deleted_at TIMESTAMP
        )
      `);

      // Warehouses
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".warehouses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          location VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE
        )
      `);

      // Inventory
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".inventory (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          master_sku_id UUID REFERENCES "${schemaName}".master_skus(id),
          warehouse_id UUID REFERENCES "${schemaName}".warehouses(id),
          quantity INT NOT NULL DEFAULT 0,
          reserved_quantity INT NOT NULL DEFAULT 0,
          safety_stock INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Channel Mappings
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".channel_mappings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          master_sku_id UUID REFERENCES "${schemaName}".master_skus(id),
          channel VARCHAR(50) NOT NULL,
          external_item_id VARCHAR(255) NOT NULL,
          external_variant_id VARCHAR(255),
          UNIQUE(channel, external_item_id, external_variant_id)
        )
      `);

      // Orders
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_number VARCHAR(100) UNIQUE NOT NULL,
          channel VARCHAR(50) NOT NULL,
          external_order_id VARCHAR(255) NOT NULL,
          customer_name VARCHAR(255),
          customer_phone VARCHAR(50),
          status VARCHAR(50) NOT NULL,
          total_amount DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT NOW(),
          synced_at TIMESTAMP
        )
      `);

      // Order Items
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID REFERENCES "${schemaName}".orders(id),
          master_sku_id UUID REFERENCES "${schemaName}".master_skus(id),
          quantity INT NOT NULL,
          unit_price DECIMAL(10, 2),
          subtotal DECIMAL(10, 2)
        )
      `);

      // Audit Logs
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50),
          entity_id UUID,
          changes JSONB,
          ip_address INET,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes (IF NOT EXISTS is handled by Postgres usually or we use DO block,
      // but simpler `CREATE INDEX IF NOT EXISTS` works in newer PG.
      // For safety, we use the standard syntax supported by most recent PG versions)
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_master_skus_sku_code ON "${schemaName}".master_skus(sku_code)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_inventory_master_sku ON "${schemaName}".inventory(master_sku_id)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_orders_order_number ON "${schemaName}".orders(order_number)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_orders_channel ON "${schemaName}".orders(channel)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON "${schemaName}".audit_logs(entity_type, entity_id)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // We do not drop tables in Sync migration as it might cause data loss.
    // This migration is intended to be additive/fixing.
  }
}
