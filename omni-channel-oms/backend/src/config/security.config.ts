export type RuntimeEnv = Readonly<Record<string, string | undefined>>;

export interface CorsRuntimeOptions {
  origin: string[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

const TEST_JWT_SECRET = 'test-only-jwt-secret-please-do-not-use-in-production';

const DEFAULT_LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const WEAK_JWT_SECRETS = new Set([
  'default-secret-key',
  'secret',
  'your-super-secret-jwt-key-change-in-production-min-32-chars',
]);

function getNodeEnv(env: RuntimeEnv): string {
  return env.NODE_ENV?.trim() || 'development';
}

function requireConfigValue(name: string, env: RuntimeEnv): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function resolveJwtSecret(env: RuntimeEnv = process.env): string {
  const nodeEnv = getNodeEnv(env);

  if (nodeEnv === 'test' && !env.JWT_SECRET?.trim()) {
    return TEST_JWT_SECRET;
  }

  const secret = requireConfigValue('JWT_SECRET', env);

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  if (nodeEnv === 'production' && WEAK_JWT_SECRETS.has(secret)) {
    throw new Error('JWT_SECRET must not use a default placeholder value');
  }

  return secret;
}

export function buildCorsOptions(
  env: RuntimeEnv = process.env,
): CorsRuntimeOptions {
  const configuredOrigins = env.CORS_ORIGINS?.trim();
  const isProduction = getNodeEnv(env) === 'production';

  if (!configuredOrigins) {
    if (isProduction) {
      throw new Error('CORS_ORIGINS is required in production');
    }

    return {
      origin: DEFAULT_LOCAL_ORIGINS,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'x-tenant-id',
      ],
      credentials: false,
    };
  }

  const origins = parseCsv(configuredOrigins);

  if (origins.includes('*')) {
    throw new Error('CORS_ORIGINS must not contain wildcard origins');
  }

  return {
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-tenant-id'],
    credentials: false,
  };
}

export function isSwaggerEnabled(env: RuntimeEnv = process.env): boolean {
  const explicitValue = env.SWAGGER_ENABLED?.trim().toLowerCase();

  if (explicitValue === 'true') {
    return true;
  }

  if (explicitValue === 'false') {
    return false;
  }

  return getNodeEnv(env) !== 'production';
}
