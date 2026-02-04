import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import { UserTenantRole } from './entities/user-tenant-role.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV', 'development');
        const isDevOrLocal = ['development', 'local'].includes(nodeEnv);

        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('POSTGRES_USER', 'oms_user'),
          password: configService.get('POSTGRES_PASSWORD', 'oms_password'),
          database: configService.get('POSTGRES_DB', 'oms_production'),
          entities: [User, Tenant, UserTenantRole],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: false, // Never use synchronize - use migrations instead
          migrationsRun: isDevOrLocal, // Auto-run migrations in dev/local
          logging: isDevOrLocal,
          schema: 'public',
        };
      },
    }),
    TypeOrmModule.forFeature([User, Tenant, UserTenantRole]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
