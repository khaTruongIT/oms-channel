import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_SCHEMAS_QUERY = `
  SELECT schema_name
  FROM public.tenants
  ORDER BY schema_name
`;

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

export class AddLeanCoreReliability1706608000000 implements MigrationInterface {
  public readonly name = 'AddLeanCoreReliability1706608000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.channel_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        shop_id VARCHAR(255) NOT NULL,
        shop_name VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING_CONTRACT',
        credentials_ciphertext TEXT,
        token_expires_at TIMESTAMP,
        webhook_callback_id UUID NOT NULL DEFAULT gen_random_uuid(),
        last_connected_at TIMESTAMP,
        last_error VARCHAR(500),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_channel_accounts_tenant_provider_shop UNIQUE (tenant_id, provider, shop_id),
        CONSTRAINT uq_channel_accounts_callback UNIQUE (webhook_callback_id)
      )
    `);

    const schemas = (await queryRunner.query(TENANT_SCHEMAS_QUERY)) as Array<{
      schema_name: string;
    }>;

    for (const { schema_name: schemaName } of schemas) {
      const schema = quoteIdentifier(schemaName);
      await queryRunner.query(
        `ALTER TABLE ${schema}.orders ADD COLUMN IF NOT EXISTS channel_account_id UUID`,
      );
      await queryRunner.query(
        `ALTER TABLE ${schema}.orders ADD COLUMN IF NOT EXISTS external_status VARCHAR(100)`,
      );
      await queryRunner.query(
        `ALTER TABLE ${schema}.orders ADD COLUMN IF NOT EXISTS external_updated_at TIMESTAMP`,
      );
      await queryRunner.query(
        `ALTER TABLE ${schema}.order_items ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES ${schema}.warehouses(id)`,
      );
      await queryRunner.query(
        `ALTER TABLE ${schema}.channel_mappings ADD COLUMN IF NOT EXISTS channel_account_id UUID REFERENCES public.channel_accounts(id) ON DELETE CASCADE`,
      );

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.inventory_movements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          inventory_id UUID NOT NULL REFERENCES ${schema}.inventory(id),
          master_sku_id UUID NOT NULL REFERENCES ${schema}.master_skus(id),
          warehouse_id UUID NOT NULL REFERENCES ${schema}.warehouses(id),
          order_id UUID REFERENCES ${schema}.orders(id),
          movement_type VARCHAR(30) NOT NULL,
          quantity_delta INT NOT NULL,
          reserved_delta INT NOT NULL DEFAULT 0,
          idempotency_key VARCHAR(255) NOT NULL,
          actor_user_id UUID,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          CONSTRAINT uq_inventory_movements_idempotency UNIQUE (idempotency_key)
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.webhook_inbox (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
          provider VARCHAR(50) NOT NULL,
          delivery_id VARCHAR(255) NOT NULL,
          payload JSONB NOT NULL,
          received_at TIMESTAMP NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMP,
          status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
          attempt_count INT NOT NULL DEFAULT 0,
          last_error VARCHAR(500),
          CONSTRAINT uq_webhook_inbox_delivery UNIQUE (channel_account_id, delivery_id)
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.outbox_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_account_id UUID REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
          event_type VARCHAR(100) NOT NULL,
          aggregate_type VARCHAR(50) NOT NULL,
          aggregate_id UUID NOT NULL,
          payload JSONB NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
          attempts INT NOT NULL DEFAULT 0,
          available_at TIMESTAMP NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMP,
          last_error VARCHAR(500),
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.integration_exceptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_account_id UUID REFERENCES public.channel_accounts(id) ON DELETE SET NULL,
          exception_type VARCHAR(100) NOT NULL,
          severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
          status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
          message VARCHAR(500) NOT NULL,
          context JSONB NOT NULL DEFAULT '{}'::jsonb,
          retry_count INT NOT NULL DEFAULT 0,
          resolved_by UUID,
          resolved_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.reconciliation_runs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_account_id UUID REFERENCES public.channel_accounts(id) ON DELETE SET NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
          started_at TIMESTAMP NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMP,
          findings_count INT NOT NULL DEFAULT 0,
          summary JSONB NOT NULL DEFAULT '{}'::jsonb
        )
      `);

      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_account_external_order_unique ON ${schema}.orders(channel_account_id, external_order_id) WHERE channel_account_id IS NOT NULL`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_legacy_channel_external_order_unique ON ${schema}.orders(channel, external_order_id) WHERE channel_account_id IS NULL`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_mappings_account_item_variant_unique ON ${schema}.channel_mappings(channel_account_id, external_item_id, COALESCE(external_variant_id, ''))`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_webhook_inbox_status ON ${schema}.webhook_inbox(status, received_at)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_outbox_events_ready ON ${schema}.outbox_events(status, available_at)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_integration_exceptions_status ON ${schema}.integration_exceptions(status, severity, created_at)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schemas = (await queryRunner.query(TENANT_SCHEMAS_QUERY)) as Array<{
      schema_name: string;
    }>;

    for (const { schema_name: schemaName } of schemas) {
      const schema = quoteIdentifier(schemaName);
      await queryRunner.query(
        `DROP TABLE IF EXISTS ${schema}.reconciliation_runs`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS ${schema}.integration_exceptions`,
      );
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.outbox_events`);
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.webhook_inbox`);
      await queryRunner.query(
        `DROP TABLE IF EXISTS ${schema}.inventory_movements`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS ${schema}.idx_orders_account_external_order_unique`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS ${schema}.idx_orders_legacy_channel_external_order_unique`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS ${schema}.idx_mappings_account_item_variant_unique`,
      );
      await queryRunner.query(
        `ALTER TABLE ${schema}.channel_mappings DROP COLUMN IF EXISTS channel_account_id`,
      );
      await queryRunner.query(
        `ALTER TABLE ${schema}.order_items DROP COLUMN IF EXISTS warehouse_id`,
      );
      await queryRunner.query(
        `ALTER TABLE ${schema}.orders DROP COLUMN IF EXISTS external_updated_at`,
      );
      await queryRunner.query(
        `ALTER TABLE ${schema}.orders DROP COLUMN IF EXISTS external_status`,
      );
      await queryRunner.query(
        `ALTER TABLE ${schema}.orders DROP COLUMN IF EXISTS channel_account_id`,
      );
    }

    await queryRunner.query('DROP TABLE IF EXISTS public.channel_accounts');
  }
}
