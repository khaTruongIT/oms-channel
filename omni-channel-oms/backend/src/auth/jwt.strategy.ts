import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { UserTenantRole } from '../database/entities/user-tenant-role.entity';
import { TenantStatus } from '../database/entities/tenant.entity';
import { resolveJwtSecret } from '../config/security.config';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    @InjectRepository(UserTenantRole)
    private readonly userTenantRoleRepository: Repository<UserTenantRole>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret({
        NODE_ENV: configService.get<string>('NODE_ENV'),
        JWT_SECRET: configService.get<string>('JWT_SECRET'),
      }),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tenantId = this.getRequestedTenantId(req, payload);

    if (!tenantId) {
      return {
        userId: payload.sub,
        email: payload.email,
      };
    }

    const userTenantRole = await this.userTenantRoleRepository.findOne({
      where: {
        userId: user.id,
        tenantId,
      },
      relations: ['tenant'],
    });

    if (!this.canAccessTenant(userTenantRole)) {
      throw new UnauthorizedException('Tenant access is not authorized');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId,
      schemaName: userTenantRole.tenant.schemaName,
      role: userTenantRole.role,
    };
  }

  private getRequestedTenantId(
    req: Request,
    payload: JwtPayload,
  ): string | undefined {
    const headerValue = req.headers['x-tenant-id'];
    const headerTenantId =
      typeof headerValue === 'string' ? headerValue : undefined;

    if (
      payload.tenantId &&
      headerTenantId &&
      payload.tenantId !== headerTenantId
    ) {
      throw new UnauthorizedException('Tenant context does not match token');
    }

    return payload.tenantId ?? headerTenantId;
  }

  private canAccessTenant(
    userTenantRole: UserTenantRole | null,
  ): userTenantRole is UserTenantRole {
    if (!userTenantRole?.tenant) {
      return false;
    }

    const { tenant } = userTenantRole;
    return (
      tenant.isActive &&
      tenant.status !== TenantStatus.SUSPENDED &&
      tenant.status !== TenantStatus.CANCELLED
    );
  }
}
