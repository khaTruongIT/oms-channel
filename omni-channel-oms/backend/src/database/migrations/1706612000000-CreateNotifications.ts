import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1706612000000 implements MigrationInterface {
  name = 'CreateNotifications1706612000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenants = (await queryRunner.query(
      `SELECT schema_name FROM public.tenants WHERE schema_name IS NOT NULL`,
    )) as Array<{ schema_name: string }>;

    const schemas = new Set<string>();
    schemas.add('public');
    for (const t of tenants) {
      if (t.schema_name) {
        schemas.add(t.schema_name);
      }
    }

    for (const schema of schemas) {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(64) NOT NULL,
          severity VARCHAR(32) NOT NULL DEFAULT 'INFO',
          title VARCHAR(255) NOT NULL,
          body TEXT NOT NULL,
          link VARCHAR(255) NULL,
          dedupe_key VARCHAR(255) NULL,
          read_at TIMESTAMPTZ NULL,
          user_id UUID NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe
        ON "${schema}".notifications(dedupe_key)
        WHERE dedupe_key IS NOT NULL;
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_notifications_user_read
        ON "${schema}".notifications(user_id, read_at);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at
        ON "${schema}".notifications(created_at DESC);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tenants = (await queryRunner.query(
      `SELECT schema_name FROM public.tenants WHERE schema_name IS NOT NULL`,
    )) as Array<{ schema_name: string }>;

    const schemas = new Set<string>();
    schemas.add('public');
    for (const t of tenants) {
      if (t.schema_name) {
        schemas.add(t.schema_name);
      }
    }

    for (const schema of schemas) {
      await queryRunner.query(`
        DROP TABLE IF EXISTS "${schema}".notifications CASCADE;
      `);
    }
  }
}
