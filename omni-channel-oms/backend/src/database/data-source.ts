import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const isDevOrLocal = ['development', 'local'].includes(
  process.env.NODE_ENV || 'development',
);

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'oms_user',
  password: process.env.POSTGRES_PASSWORD || 'oms_password',
  database: process.env.POSTGRES_DB || 'oms_production',
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // Never use synchronize - use migrations
  migrationsRun: isDevOrLocal, // Auto-run migrations in dev/local
  logging: isDevOrLocal,
  schema: 'public',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
