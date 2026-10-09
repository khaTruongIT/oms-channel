import { dataSourceOptions } from './data-source';
import { AddInventoryIntegrityConstraints1706606000000 } from './migrations/1706606000000-AddInventoryIntegrityConstraints';

describe('database migration configuration', () => {
  it('runs migrations independently when a migration controls its transaction', () => {
    expect(dataSourceOptions.migrationsTransactionMode).toBe('each');
    expect(
      new AddInventoryIntegrityConstraints1706606000000().transaction,
    ).toBe(false);
  });

  it('loads timestamped migrations without loading migration test files', () => {
    expect(dataSourceOptions.migrations).toEqual([
      expect.stringContaining('/migrations/[0-9]*-!(*.spec){.ts,.js}'),
    ]);
  });
});
