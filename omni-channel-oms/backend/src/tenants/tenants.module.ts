import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';
import { TenantLimitsService } from './tenant-limits.service';
import { TenantMembersService } from './tenant-members.service';
import { TenantsController } from './tenants.controller';
import { TenantMembersController } from './tenant-members.controller';
import { Tenant } from '../database/entities/tenant.entity';
import { UserTenantRole } from '../database/entities/user-tenant-role.entity';
import { TenantInvite } from '../database/entities/tenant-invite.entity';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, UserTenantRole, TenantInvite, User]),
  ],
  controllers: [TenantsController, TenantMembersController],
  providers: [TenantsService, TenantLimitsService, TenantMembersService],
  exports: [TenantsService, TenantLimitsService, TenantMembersService],
})
export class TenantsModule {}
