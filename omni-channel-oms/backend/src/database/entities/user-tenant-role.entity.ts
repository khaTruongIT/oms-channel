import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

export enum UserRole {
  OWNER = 'OWNER',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
  SALES_STAFF = 'SALES_STAFF',
}

@Entity({ schema: 'public', name: 'user_tenant_roles' })
@Unique(['userId', 'tenantId'])
export class UserTenantRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.tenantRoles)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.userRoles)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 50 })
  role: UserRole;
}
