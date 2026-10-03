import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { User } from '../database/entities/user.entity';
import { TenantsService } from '../tenants/tenants.service';
import { AuthService } from './auth.service';

type UserRepositoryMock = Pick<Repository<User>, 'findOne'>;
type RefreshTokenRepositoryMock = Pick<
  Repository<RefreshToken>,
  'create' | 'delete' | 'findOne' | 'save' | 'update'
>;

function createUser(): User {
  return {
    id: 'user-1',
    email: 'pilot@example.com',
    passwordHash: 'hash',
    firstName: 'Pilot',
    lastName: 'User',
    phone: null,
    timezone: 'UTC',
    avatarUrl: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    tenantRoles: [],
  } as User;
}

function buildService() {
  const user = createUser();
  const refreshTokens: RefreshToken[] = [];

  const userRepository: jest.Mocked<UserRepositoryMock> = {
    findOne: jest.fn().mockResolvedValue(user),
  };

  const refreshTokenRepository: jest.Mocked<RefreshTokenRepositoryMock> = {
    create: jest.fn((data: Partial<RefreshToken>) => data as RefreshToken),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
    findOne: jest.fn(({ where }: { where: { id: string } }) => {
      const record = refreshTokens.find((token) => token.id === where.id);
      return Promise.resolve(record ? { ...record, user } : null);
    }),
    save: jest.fn((token: RefreshToken) => {
      const existingIndex = refreshTokens.findIndex(
        (stored) => stored.id === token.id,
      );
      if (existingIndex >= 0) {
        refreshTokens[existingIndex] = {
          ...refreshTokens[existingIndex],
          ...token,
        };
        return Promise.resolve(refreshTokens[existingIndex]);
      }

      refreshTokens.push({ ...token });
      return Promise.resolve(token);
    }),
    update: jest.fn((criteria: Partial<RefreshToken>, patch) => {
      let affected = 0;
      for (const token of refreshTokens) {
        const matchesUser =
          !criteria.userId || token.userId === criteria.userId;
        const matchesRevoked =
          criteria.revoked === undefined || token.revoked === criteria.revoked;

        if (matchesUser && matchesRevoked) {
          Object.assign(token, patch);
          affected += 1;
        }
      }

      return Promise.resolve({ affected });
    }),
  };

  const jwtService: Pick<JwtService, 'sign'> = {
    sign: jest.fn((payload: { sub: string }) => `access-token:${payload.sub}`),
  };

  const service = new AuthService(
    userRepository as unknown as Repository<User>,
    refreshTokenRepository as unknown as Repository<RefreshToken>,
    jwtService as JwtService,
    {} as TenantsService,
  );

  return {
    refreshTokenRepository,
    refreshTokens,
    service,
  };
}

describe('AuthService refresh token rotation', () => {
  it('rotates refresh tokens and revokes the token that was just used', async () => {
    const { refreshTokens, service } = buildService();
    const originalRefreshToken = await service.generateRefreshToken('user-1');

    const result = await service.refreshAccessToken(originalRefreshToken);

    expect(result.access_token).toBe('access-token:user-1');
    expect(result.refresh_token).toBeDefined();
    expect(result.refresh_token).not.toBe(originalRefreshToken);
    expect(refreshTokens).toHaveLength(2);
    expect(refreshTokens[0]?.revoked).toBe(true);
    expect(refreshTokens[1]?.revoked).toBe(false);
  });

  it('detects reuse of a revoked refresh token and revokes active sessions for the user', async () => {
    const { refreshTokens, service } = buildService();
    const originalRefreshToken = await service.generateRefreshToken('user-1');
    await service.refreshAccessToken(originalRefreshToken);

    await expect(
      service.refreshAccessToken(originalRefreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(refreshTokens.every((token) => token.revoked)).toBe(true);
  });
});
