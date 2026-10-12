import { QueryRunner } from 'typeorm';
import { CreateNotifications1706612000000 } from './1706612000000-CreateNotifications';

describe('CreateNotifications1706612000000 Migration', () => {
  let migration: CreateNotifications1706612000000;
  let queryRunner: jest.Mocked<QueryRunner>;

  beforeEach(() => {
    migration = new CreateNotifications1706612000000();
    queryRunner = {
      query: jest.fn().mockImplementation((sql: string) => {
        if (sql.includes('SELECT schema_name FROM public.tenants')) {
          return Promise.resolve([
            { schema_name: 'tenant_alpha' },
            { schema_name: 'tenant_beta' },
          ]);
        }
        return Promise.resolve([]);
      }),
    } as any;
  });

  it('should create notifications table and indexes in public and all tenant schemas', async () => {
    await migration.up(queryRunner);

    // Should create table in tenant_alpha, tenant_beta, and public
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "tenant_alpha".notifications'),
    );
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "tenant_beta".notifications'),
    );
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "public".notifications'),
    );

    // Should create dedupe unique index
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe'),
    );
  });

  it('should drop notifications table on down migration', async () => {
    await migration.down(queryRunner);

    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('DROP TABLE IF EXISTS "tenant_alpha".notifications CASCADE'),
    );
  });
});
