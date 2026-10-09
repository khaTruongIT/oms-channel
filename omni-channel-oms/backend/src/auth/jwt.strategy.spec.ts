import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Repository } from 'typeorm';
import type { AuthService } from './auth.service';
import { JwtStrategy, type JwtPayload } from './jwt.strategy';
import { Tenant, TenantStatus } from '../database/entities/tenant.entity';
import {
  UserRole,
  UserTenantRole,
} from '../database/entities/user-tenant-role.entity';

const userId = 'user-1';
const tenantId = 'tenant-1';

type UserTenantRoleRepositoryMock = Pick<Repository<UserTenantRole>, 'findOne'>;

function createRequest(headerTenantId?: string): Request {
  return {
    headers: headerTenantId ? { 'x-tenant-id': headerTenantId } : {},
  } as Request;
}

function createMembership(
  status: TenantStatus = TenantStatus.ACTIVE,
  isActive = true,
): UserTenantRole {
  return {
    id: 'membership-1',
    userId,
    tenantId,
    role: UserRole.WAREHOUSE_MANAGER,
    tenant: {
      id: tenantId,
      schemaName: 'tenant_one',
      isActive,
      status,
    } as Tenant,
  } as UserTenantRole;
}

function buildStrategy(membership: UserTenantRole | null): {
  strategy: JwtStrategy;
  userTenantRoleRepository: jest.Mocked<UserTenantRoleRepositoryMock>;
} {
  const userTenantRoleRepository: jest.Mocked<UserTenantRoleRepositoryMock> = {
    findOne: jest.fn().mockResolvedValue(membership),
  };
  const configService = {
    get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'test' : undefined)),
  } as unknown as ConfigService;
  const authService = {
    validateUser: jest.fn().mockResolvedValue({ id: userId }),
  } as unknown as AuthService;

  return {
    strategy: new JwtStrategy(
      configService,
      authService,
      userTenantRoleRepository as unknown as Repository<UserTenantRole>,
    ),
    userTenantRoleRepository,
  };
}

describe('JwtStrategy tenant context', () => {
  const payload: JwtPayload = {
    sub: userId,
    email: 'user@example.com',
  };

  it('uses the database membership role for a header-selected active tenant', async () => {
    const { strategy, userTenantRoleRepository } =
      buildStrategy(createMembership());

    const context = await strategy.validate(createRequest(tenantId), {
      ...payload,
      role: UserRole.OWNER,
    });

    expect(context).toMatchObject({
      tenantId,
      schemaName: 'tenant_one',
      role: UserRole.WAREHOUSE_MANAGER,
    });
    expect(userTenantRoleRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId, tenantId },
        relations: ['tenant'],
      }),
    );
  });

  it('rejects a suspended tenant selected by request header', async () => {
    const { strategy } = buildStrategy(
      createMembership(TenantStatus.SUSPENDED, false),
    );

    await expect(
      strategy.validate(createRequest(tenantId), payload),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a cancelled tenant selected by request header', async () => {
    const { strategy } = buildStrategy(
      createMembership(TenantStatus.CANCELLED, false),
    );

    await expect(
      strategy.validate(createRequest(tenantId), payload),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an inactive tenant selected by request header', async () => {
    const { strategy } = buildStrategy(
      createMembership(TenantStatus.ACTIVE, false),
    );

    await expect(
      strategy.validate(createRequest(tenantId), payload),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('keeps pending tenants available during onboarding', async () => {
    const { strategy } = buildStrategy(createMembership(TenantStatus.PENDING));

    await expect(
      strategy.validate(createRequest(tenantId), payload),
    ).resolves.toMatchObject({
      tenantId,
      role: UserRole.WAREHOUSE_MANAGER,
    });
  });

  it('rejects a tenant supplied by a token when membership is absent', async () => {
    const { strategy } = buildStrategy(null);

    await expect(
      strategy.validate(createRequest(), { ...payload, tenantId }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a request when the token and tenant header disagree', async () => {
    const { strategy } = buildStrategy(createMembership());

    await expect(
      strategy.validate(createRequest('tenant-2'), { ...payload, tenantId }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns an authenticated user without tenant context when none is requested', async () => {
    const { strategy, userTenantRoleRepository } = buildStrategy(null);

    await expect(strategy.validate(createRequest(), payload)).resolves.toEqual({
      userId,
      email: payload.email,
    });
    expect(userTenantRoleRepository.findOne).not.toHaveBeenCalled();
  });
});
