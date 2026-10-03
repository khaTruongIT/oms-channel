import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../database/entities/tenant.entity';
import {
  UserRole,
  UserTenantRole,
} from '../database/entities/user-tenant-role.entity';
import { TenantsService } from './tenants.service';

type TenantRepositoryMock = Pick<
  Repository<Tenant>,
  'create' | 'findOne' | 'save'
>;
type UserTenantRoleRepositoryMock = Pick<
  Repository<UserTenantRole>,
  'create' | 'findOne' | 'save'
>;
type QueryRunnerMock = Pick<QueryRunner, 'connect' | 'query' | 'release'>;

function createQueryRunnerMock(): jest.Mocked<QueryRunnerMock> {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
  };
}

function createTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-1',
    schemaName: 'tenant_schema',
    shopName: 'Demo Shop',
    ownerId: 'owner-1',
    isActive: true,
    status: TenantStatus.ACTIVE,
    onboardingCompleted: true,
    timezone: 'UTC',
    currency: 'USD',
    locale: 'en-US',
    dateFormat: 'YYYY-MM-DD',
    maxChannels: 3,
    maxProducts: 100,
    maxWarehouses: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    userRoles: [],
    ...overrides,
  } as Tenant;
}

describe('TenantsService tenant access', () => {
  let tenantRepository: jest.Mocked<TenantRepositoryMock>;
  let userTenantRoleRepository: jest.Mocked<UserTenantRoleRepositoryMock>;
  let service: TenantsService;

  beforeEach(() => {
    tenantRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    userTenantRoleRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    service = new TenantsService(
      tenantRepository as unknown as Repository<Tenant>,
      userTenantRoleRepository as unknown as Repository<UserTenantRole>,
      {} as DataSource,
    );
  });

  it('returns tenant details when user is a member', async () => {
    const tenant = createTenant();
    tenantRepository.findOne.mockResolvedValue(tenant);
    userTenantRoleRepository.findOne.mockResolvedValue({
      id: 'role-1',
      userId: 'user-1',
      tenantId: tenant.id,
      role: UserRole.SALES_STAFF,
    } as UserTenantRole);

    await expect(service.getTenantForUser(tenant.id, 'user-1')).resolves.toBe(
      tenant,
    );
  });

  it('rejects tenant details when user is not a member', async () => {
    const tenant = createTenant();
    tenantRepository.findOne.mockResolvedValue(tenant);
    userTenantRoleRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getTenantForUser(tenant.id, 'outside-user'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('preserves not found behavior for missing tenants', async () => {
    tenantRepository.findOne.mockResolvedValue(null);

    await expect(
      service.assertUserCanAccessTenant('user-1', 'missing-tenant'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(userTenantRoleRepository.findOne).not.toHaveBeenCalled();
  });

  it('creates inventory table with database-level stock invariants for new tenants', async () => {
    const queryRunner = createQueryRunnerMock();
    const tenant = createTenant();
    const userTenantRole = {
      id: 'role-1',
      userId: 'owner-1',
      tenantId: tenant.id,
      role: UserRole.OWNER,
    } as UserTenantRole;

    tenantRepository.create.mockReturnValue(tenant);
    tenantRepository.save.mockResolvedValue(tenant);
    userTenantRoleRepository.create.mockReturnValue(userTenantRole);
    userTenantRoleRepository.save.mockResolvedValue(userTenantRole);
    service = new TenantsService(
      tenantRepository as unknown as Repository<Tenant>,
      userTenantRoleRepository as unknown as Repository<UserTenantRole>,
      {
        createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      } as unknown as DataSource,
    );

    await service.createTenant('owner-1', { shopName: 'Demo Shop' });

    const inventoryTableSql = queryRunner.query.mock.calls
      .map(([sql]) => sql)
      .find((sql) => sql.includes('.inventory'));

    expect(inventoryTableSql).toContain('CHECK (quantity >= 0)');
    expect(inventoryTableSql).toContain('CHECK (reserved_quantity >= 0)');
    expect(inventoryTableSql).toContain('CHECK (safety_stock >= 0)');
    expect(inventoryTableSql).toContain(
      'CONSTRAINT chk_inventory_reserved_lte_quantity CHECK (reserved_quantity <= quantity)',
    );
    expect(inventoryTableSql).toContain(
      'CONSTRAINT uq_inventory_sku_warehouse UNIQUE (master_sku_id, warehouse_id)',
    );
  });
});
