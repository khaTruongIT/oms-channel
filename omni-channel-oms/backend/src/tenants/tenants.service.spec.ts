import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
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
interface QueryRunnerMock {
  commitTransaction: jest.Mock<Promise<void>, []>;
  connect: jest.Mock<Promise<void>, []>;
  query: jest.Mock<Promise<unknown>, [string]>;
  release: jest.Mock<Promise<void>, []>;
  rollbackTransaction: jest.Mock<Promise<void>, []>;
  startTransaction: jest.Mock<Promise<void>, []>;
  manager: {
    save: jest.Mock<Promise<unknown>, [unknown]>;
  };
}

function createQueryRunnerMock(): QueryRunnerMock {
  return {
    commitTransaction: jest
      .fn<Promise<void>, []>()
      .mockResolvedValue(undefined),
    connect: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
    query: jest.fn<Promise<unknown>, [string]>().mockResolvedValue(undefined),
    release: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
    rollbackTransaction: jest
      .fn<Promise<void>, []>()
      .mockResolvedValue(undefined),
    startTransaction: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
    manager: {
      save: jest.fn<Promise<unknown>, [unknown]>(),
    },
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

  it('activates a pending tenant when its owner completes onboarding', async () => {
    const tenant = createTenant({
      status: TenantStatus.PENDING,
      onboardingCompleted: false,
    });
    tenantRepository.findOne.mockResolvedValue(tenant);
    tenantRepository.save.mockResolvedValue(tenant);
    userTenantRoleRepository.findOne.mockResolvedValue({
      id: 'role-1',
      userId: 'owner-1',
      tenantId: tenant.id,
      role: UserRole.OWNER,
    } as UserTenantRole);

    await expect(
      service.completeOnboarding(tenant.id, 'owner-1'),
    ).resolves.toMatchObject({
      status: TenantStatus.ACTIVE,
      isActive: true,
      onboardingCompleted: true,
    });
    expect(tenantRepository.save).toHaveBeenCalledWith(tenant);
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
    userTenantRoleRepository.create.mockReturnValue(userTenantRole);
    queryRunner.manager.save
      .mockResolvedValueOnce(tenant)
      .mockResolvedValueOnce(userTenantRole);
    service = new TenantsService(
      tenantRepository as unknown as Repository<Tenant>,
      userTenantRoleRepository as unknown as Repository<UserTenantRole>,
      {
        createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      } as unknown as DataSource,
    );

    await service.createTenant('owner-1', { shopName: 'Demo Shop' });

    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
    expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
    expect(userTenantRoleRepository.create).toHaveBeenCalledWith({
      userId: 'owner-1',
      tenantId: tenant.id,
      role: UserRole.OWNER,
    });

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

  it('rolls back provisioning when the tenant schema cannot be created', async () => {
    const queryRunner = createQueryRunnerMock();
    const tenant = createTenant();
    const userTenantRole = {
      id: 'role-1',
      userId: 'owner-1',
      tenantId: tenant.id,
      role: UserRole.OWNER,
    } as UserTenantRole;

    tenantRepository.create.mockReturnValue(tenant);
    userTenantRoleRepository.create.mockReturnValue(userTenantRole);
    queryRunner.manager.save.mockResolvedValueOnce(tenant);
    queryRunner.query.mockRejectedValueOnce(new Error('schema unavailable'));
    service = new TenantsService(
      tenantRepository as unknown as Repository<Tenant>,
      userTenantRoleRepository as unknown as Repository<UserTenantRole>,
      {
        createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      } as unknown as DataSource,
    );

    await expect(
      service.createTenant('owner-1', { shopName: 'Demo Shop' }),
    ).rejects.toThrow('schema unavailable');
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});
