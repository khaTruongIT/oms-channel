import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../database/entities/user.entity';
import { UserTenantRole } from '../database/entities/user-tenant-role.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { resolveJwtSecret } from '../config/security.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserTenantRole, Tenant, RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: resolveJwtSecret({
          NODE_ENV: configService.get<string>('NODE_ENV'),
          JWT_SECRET: configService.get<string>('JWT_SECRET'),
        }),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '15m',
        },
      }),
    }),
    forwardRef(() => TenantsModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
