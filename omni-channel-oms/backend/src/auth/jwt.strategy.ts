import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { UserTenantRole } from '../database/entities/user-tenant-role.entity';
import { Tenant } from '../database/entities/tenant.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    @InjectRepository(UserTenantRole)
    private readonly userTenantRoleRepository: Repository<UserTenantRole>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'default-secret-key',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    let tenantId = payload.tenantId;
    let schemaName: string | undefined;
    let role = payload.role;

    // If tenantId is not in token, check header
    if (!tenantId) {
      const headerTenantId = req.headers['x-tenant-id'];
      if (headerTenantId && typeof headerTenantId === 'string') {
        // Verify user has access to this tenant
        const userTenantRole = await this.userTenantRoleRepository.findOne({
          where: {
            userId: user.id,
            tenantId: headerTenantId,
          },
          relations: ['tenant'],
        });

        if (userTenantRole) {
          tenantId = headerTenantId;
          schemaName = userTenantRole.tenant.schemaName;
          role = userTenantRole.role;
        }
      }
    } else {
      // If tenantId IS in token (future proofing), we might need to fetch schemaName if not in token
      // But currently we don't put it in token, so we assume header approach primarily.
      if (!schemaName) {
        const tenant = await this.tenantRepository.findOne({
          where: { id: tenantId },
        });
        if (tenant) {
          schemaName = tenant.schemaName;
        }
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId,
      schemaName,
      role,
    };
  }
}
