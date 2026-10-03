import { AddProductPublicMetadata1706607000000 } from './1706607000000-AddProductPublicMetadata';

describe('AddProductPublicMetadata1706607000000', () => {
  const makeQueryRunner = () => ({
    query: jest.fn().mockResolvedValue([{ table_schema: 'tenant_schema' }]),
  });

  it('adds public metadata JSONB column to every tenant master_skus table', async () => {
    const migration = new AddProductPublicMetadata1706607000000();
    const queryRunner = makeQueryRunner();

    await migration.up(queryRunner as never);

    const sql = queryRunner.query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('ALTER TABLE "tenant_schema".master_skus');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS public_metadata JSONB');
  });

  it('drops public metadata column on rollback', async () => {
    const migration = new AddProductPublicMetadata1706607000000();
    const queryRunner = makeQueryRunner();

    await migration.down(queryRunner as never);

    const sql = queryRunner.query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DROP COLUMN IF EXISTS public_metadata');
  });
});
