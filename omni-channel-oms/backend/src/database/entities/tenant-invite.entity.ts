import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { UserRole } from './user-tenant-role.entity';

@Entity({ schema: 'public', name: 'tenant_invites' })
export class TenantInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  role: UserRole;

  @Column({ type: 'uuid', name: 'invited_by' })
  invitedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by' })
  inviter: User;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamp', name: 'accepted_at', nullable: true })
  acceptedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
