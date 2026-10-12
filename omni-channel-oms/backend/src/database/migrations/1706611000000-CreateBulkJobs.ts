import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_SCHEMAS_QUERY = `
  SELECT schema_name
  FROM public.tenants
  ORDER BY schema_name
`;

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

export class CreateBulkJobs1706611000000 implements MigrationInterface {
  public readonly name = 'CreateBulkJobs1706611000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schemas = (await queryRunner.query(TENANT_SCHEMAS_QUERY)) as Array<{
      schema_name: string;
    }>;

    for (const { schema_name: schemaName } of schemas) {
      const schema = quoteIdentifier(schemaName);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.bulk_jobs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          type VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
          total INT NOT NULL DEFAULT 0,
          processed INT NOT NULL DEFAULT 0,
          failed INT NOT NULL DEFAULT 0,
          error_report JSONB NOT NULL DEFAULT '[]'::jsonb,
          payload JSONB NULL,
          idempotency_key VARCHAR(255) NULL,
          started_at TIMESTAMP NULL,
          completed_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_bulk_jobs_status 
        ON ${schema}.bulk_jobs (status);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_bulk_jobs_idempotency 
        ON ${schema}.bulk_jobs (idempotency_key);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_bulk_jobs_created_at 
        ON ${schema}.bulk_jobs (created_at DESC);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schemas = (await queryRunner.query(TENANT_SCHEMAS_QUERY)) as Array<{
      schema_name: string;
    }>;

    for (const { schema_name: schemaName } of schemas) {
      const schema = quoteIdentifier(schemaName);

      await queryRunner.query(`
        DROP TABLE IF EXISTS ${schema}.bulk_jobs CASCADE;
      `);
    }
  }
}
