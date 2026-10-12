import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('CreateBulkJobs migration', () => {
  const source = readFileSync(
    join(__dirname, '1706611000000-CreateBulkJobs.ts'),
    'utf8',
  );

  it('creates bulk_jobs table in tenant schemas with required columns', () => {
    expect(source).toContain('CREATE TABLE IF NOT EXISTS ${schema}.bulk_jobs');
    expect(source).toContain('type VARCHAR(50) NOT NULL');
    expect(source).toContain("status VARCHAR(50) NOT NULL DEFAULT 'PENDING'");
    expect(source).toContain('total INT NOT NULL DEFAULT 0');
    expect(source).toContain('processed INT NOT NULL DEFAULT 0');
    expect(source).toContain('failed INT NOT NULL DEFAULT 0');
    expect(source).toContain("error_report JSONB NOT NULL DEFAULT '[]'::jsonb");
    expect(source).toContain('idempotency_key VARCHAR(255) NULL');
    expect(source).toContain('started_at TIMESTAMP NULL');
    expect(source).toContain('completed_at TIMESTAMP NULL');
  });

  it('creates performance indexes on bulk_jobs', () => {
    expect(source).toContain('idx_bulk_jobs_status');
    expect(source).toContain('idx_bulk_jobs_idempotency');
    expect(source).toContain('idx_bulk_jobs_created_at');
  });

  it('provides a clean down rollback path', () => {
    expect(source).toContain('DROP TABLE IF EXISTS ${schema}.bulk_jobs CASCADE');
  });
});
