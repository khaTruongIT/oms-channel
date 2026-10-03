import {
  buildCorsOptions,
  isSwaggerEnabled,
  resolveJwtSecret,
} from './security.config';

describe('security runtime config', () => {
  it('rejects missing JWT_SECRET outside test', () => {
    expect(() =>
      resolveJwtSecret({
        NODE_ENV: 'production',
      }),
    ).toThrow('JWT_SECRET is required');
  });

  it('rejects weak production JWT secrets', () => {
    expect(() =>
      resolveJwtSecret({
        NODE_ENV: 'production',
        JWT_SECRET: 'default-secret-key',
      }),
    ).toThrow('JWT_SECRET must be at least 32 characters');
  });

  it('rejects placeholder JWT secrets in production', () => {
    expect(() =>
      resolveJwtSecret({
        NODE_ENV: 'production',
        JWT_SECRET: 'your-super-secret-jwt-key-change-in-production-min-32-chars',
      }),
    ).toThrow('JWT_SECRET must not use a default placeholder value');
  });

  it('uses a deterministic JWT secret only in tests', () => {
    expect(
      resolveJwtSecret({
        NODE_ENV: 'test',
      }),
    ).toBe('test-only-jwt-secret-please-do-not-use-in-production');
  });

  it('requires explicit CORS origins in production', () => {
    expect(() =>
      buildCorsOptions({
        NODE_ENV: 'production',
      }),
    ).toThrow('CORS_ORIGINS is required');
  });

  it('parses explicit CORS origins without wildcard', () => {
    expect(
      buildCorsOptions({
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.example.com, https://admin.example.com',
      }).origin,
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('does not allow credentialed CORS by default', () => {
    expect(
      buildCorsOptions({
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.example.com',
      }).credentials,
    ).toBe(false);
  });

  it('disables Swagger by default in production', () => {
    expect(isSwaggerEnabled({ NODE_ENV: 'production' })).toBe(false);
    expect(isSwaggerEnabled({ NODE_ENV: 'development' })).toBe(true);
  });
});
