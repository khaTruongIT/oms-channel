import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { UserTenantRole } from './user-tenant-role.entity';

export enum BusinessType {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  DISTRIBUTOR = 'distributor',
  MANUFACTURER = 'manufacturer',
}

export enum TenantPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum TenantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

@Entity({ schema: 'public', name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 63, unique: true, name: 'schema_name' })
  schemaName: string;

  @Column({ type: 'varchar', length: 255, name: 'shop_name' })
  shopName: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  // ==================== Status Management ====================
  @Column({
    type: 'enum',
    enum: TenantStatus,
    name: 'status',
    default: TenantStatus.PENDING,
  })
  status: TenantStatus;

  @Column({
    type: 'timestamp',
    name: 'suspended_at',
    nullable: true,
  })
  suspendedAt?: Date;

  @Column({
    type: 'varchar',
    length: 500,
    name: 'suspended_reason',
    nullable: true,
  })
  suspendedReason?: string;

  @Column({
    type: 'timestamp',
    name: 'cancelled_at',
    nullable: true,
  })
  cancelledAt?: Date;

  @Column({
    type: 'boolean',
    name: 'onboarding_completed',
    default: false,
  })
  onboardingCompleted: boolean;

  // ==================== Contact Information ====================
  @Column({
    type: 'varchar',
    length: 255,
    name: 'contact_email',
    nullable: true,
  })
  contactEmail?: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'contact_phone',
    nullable: true,
  })
  contactPhone?: string;

  @Column({ type: 'varchar', length: 500, name: 'website', nullable: true })
  website?: string;

  // ==================== Address Information ====================
  @Column({
    type: 'varchar',
    length: 255,
    name: 'address_line1',
    nullable: true,
  })
  addressLine1?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'address_line2',
    nullable: true,
  })
  addressLine2?: string;

  @Column({ type: 'varchar', length: 100, name: 'city', nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, name: 'state', nullable: true })
  state?: string;

  @Column({ type: 'varchar', length: 20, name: 'postal_code', nullable: true })
  postalCode?: string;

  @Column({ type: 'varchar', length: 100, name: 'country', nullable: true })
  country?: string;

  // ==================== Business Information ====================
  @Column({
    type: 'varchar',
    length: 255,
    name: 'business_name',
    nullable: true,
  })
  businessName?: string;

  @Column({
    type: 'enum',
    enum: BusinessType,
    name: 'business_type',
    nullable: true,
  })
  businessType?: BusinessType;

  @Column({ type: 'varchar', length: 100, name: 'tax_id', nullable: true })
  taxId?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'registration_number',
    nullable: true,
  })
  registrationNumber?: string;

  // ==================== Branding ====================
  @Column({ type: 'varchar', length: 500, name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'primary_color',
    nullable: true,
  })
  primaryColor?: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'secondary_color',
    nullable: true,
  })
  secondaryColor?: string;

  // ==================== Settings & Preferences ====================
  @Column({
    type: 'varchar',
    length: 50,
    name: 'timezone',
    default: 'UTC',
  })
  timezone: string;

  @Column({
    type: 'varchar',
    length: 3,
    name: 'currency',
    default: 'USD',
  })
  currency: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'locale',
    default: 'en-US',
  })
  locale: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'date_format',
    default: 'YYYY-MM-DD',
  })
  dateFormat: string;

  // ==================== Subscription & Limits ====================
  @Column({
    type: 'enum',
    enum: TenantPlan,
    name: 'plan',
    default: TenantPlan.FREE,
  })
  plan: TenantPlan;

  @Column({ type: 'int', name: 'max_channels', default: 3 })
  maxChannels: number;

  @Column({ type: 'int', name: 'max_products', default: 100 })
  maxProducts: number;

  @Column({ type: 'int', name: 'max_warehouses', default: 1 })
  maxWarehouses: number;

  // ==================== Timestamps ====================
  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // ==================== Relations ====================
  @OneToMany(() => UserTenantRole, (userTenantRole) => userTenantRole.tenant)
  userRoles: UserTenantRole[];
}
