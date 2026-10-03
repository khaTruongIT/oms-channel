import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant, TenantStatus } from '../database/entities/tenant.entity';
import {
  UserTenantRole,
  UserRole,
} from '../database/entities/user-tenant-role.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(UserTenantRole)
    private readonly userTenantRoleRepository: Repository<UserTenantRole>,
    private readonly dataSource: DataSource,
  ) {}

  async createTenant(
    userId: string,
    createTenantDto: CreateTenantDto,
  ): Promise<Tenant> {
    const { shopName, ...optionalFields } = createTenantDto;

    // Generate unique schema name
    const schemaName = `tenant_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create tenant record with all provided fields
    const tenant = this.tenantRepository.create({
      schemaName,
      shopName,
      ownerId: userId,
      isActive: true,
      ...optionalFields,
    });

    await this.tenantRepository.save(tenant);

    // Create schema in PostgreSQL
    await this.createTenantSchema(schemaName);

    // Assign owner role to creator
    const userTenantRole = this.userTenantRoleRepository.create({
      userId,
      tenantId: tenant.id,
      role: UserRole.OWNER,
    });

    await this.userTenantRoleRepository.save(userTenantRole);

    return tenant;
  }

  async createTenants(
    userId: string,
    createTenantDtos: CreateTenantDto[],
  ): Promise<Tenant[]> {
    const createdTenants: Tenant[] = [];

    for (const dto of createTenantDtos) {
      const tenant = await this.createTenant(userId, dto);
      createdTenants.push(tenant);
    }

    return createdTenants;
  }

  async updateTenant(
    tenantId: string,
    userId: string,
    updateTenantDto: UpdateTenantDto,
  ): Promise<Tenant> {
    // Check if tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if user has permission to update (owner only)
    const userRole = await this.getUserRoleInTenant(userId, tenantId);
    if (!userRole || userRole !== UserRole.OWNER) {
      throw new ForbiddenException(
        'You do not have permission to update this tenant',
      );
    }

    // Update tenant with new values
    Object.assign(tenant, updateTenantDto);

    return this.tenantRepository.save(tenant);
  }

  async getTenantsByUser(userId: string): Promise<Tenant[]> {
    const userRoles = await this.userTenantRoleRepository.find({
      where: { userId },
      relations: ['tenant'],
    });

    return userRoles.map((ur) => ur.tenant);
  }

  async getTenantById(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async assertUserCanAccessTenant(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    await this.getTenantById(tenantId);

    const userRole = await this.getUserRoleInTenant(userId, tenantId);
    if (!userRole) {
      throw new ForbiddenException('You do not have access to this tenant');
    }
  }

  async getTenantForUser(tenantId: string, userId: string): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);

    const userRole = await this.getUserRoleInTenant(userId, tenantId);
    if (!userRole) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    return tenant;
  }

  async getUserRoleInTenant(
    userId: string,
    tenantId: string,
  ): Promise<UserRole | null> {
    const userTenantRole = await this.userTenantRoleRepository.findOne({
      where: { userId, tenantId },
    });

    return userTenantRole?.role || null;
  }

  private async createTenantSchema(schemaName: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Create schema
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      // Create categories table first (referenced by master_skus)
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(name)
        )
      `);

      // Create tables in tenant schema
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".master_skus (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sku_code VARCHAR(100) UNIQUE NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          category_id UUID REFERENCES "${schemaName}".categories(id),
          variants JSONB,
          public_metadata JSONB,
          cost_price DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT NOW(),
          deleted_at TIMESTAMP
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".warehouses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          location VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".inventory (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          master_sku_id UUID REFERENCES "${schemaName}".master_skus(id),
          warehouse_id UUID REFERENCES "${schemaName}".warehouses(id),
          quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
          reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
          safety_stock INT NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT chk_inventory_reserved_lte_quantity CHECK (reserved_quantity <= quantity),
          CONSTRAINT uq_inventory_sku_warehouse UNIQUE (master_sku_id, warehouse_id)
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".channel_mappings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          master_sku_id UUID REFERENCES "${schemaName}".master_skus(id),
          channel_account_id UUID REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
          channel VARCHAR(50) NOT NULL,
          external_item_id VARCHAR(255) NOT NULL,
          external_variant_id VARCHAR(255),
          UNIQUE(channel, external_item_id, external_variant_id)
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_number VARCHAR(100) UNIQUE NOT NULL,
          channel VARCHAR(50) NOT NULL,
          channel_account_id UUID REFERENCES public.channel_accounts(id) ON DELETE SET NULL,
          external_order_id VARCHAR(255) NOT NULL,
          customer_name VARCHAR(255),
          customer_phone VARCHAR(50),
          status VARCHAR(50) NOT NULL,
          total_amount DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT NOW(),
          synced_at TIMESTAMP,
          external_status VARCHAR(100),
          external_updated_at TIMESTAMP
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID REFERENCES "${schemaName}".orders(id),
          master_sku_id UUID REFERENCES "${schemaName}".master_skus(id),
          warehouse_id UUID REFERENCES "${schemaName}".warehouses(id),
          quantity INT NOT NULL,
          unit_price DECIMAL(10, 2),
          subtotal DECIMAL(10, 2)
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50),
          entity_id UUID,
          changes JSONB,
          ip_address INET,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".inventory_movements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          inventory_id UUID NOT NULL REFERENCES "${schemaName}".inventory(id),
          master_sku_id UUID NOT NULL REFERENCES "${schemaName}".master_skus(id),
          warehouse_id UUID NOT NULL REFERENCES "${schemaName}".warehouses(id),
          order_id UUID REFERENCES "${schemaName}".orders(id),
          movement_type VARCHAR(30) NOT NULL,
          quantity_delta INT NOT NULL,
          reserved_delta INT NOT NULL DEFAULT 0,
          idempotency_key VARCHAR(255) NOT NULL UNIQUE,
          actor_user_id UUID,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".webhook_inbox (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
          provider VARCHAR(50) NOT NULL,
          delivery_id VARCHAR(255) NOT NULL,
          payload JSONB NOT NULL,
          received_at TIMESTAMP NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMP,
          status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
          attempt_count INT NOT NULL DEFAULT 0,
          last_error VARCHAR(500),
          UNIQUE(channel_account_id, delivery_id)
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".outbox_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_account_id UUID REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
          event_type VARCHAR(100) NOT NULL,
          aggregate_type VARCHAR(50) NOT NULL,
          aggregate_id UUID NOT NULL,
          payload JSONB NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
          attempts INT NOT NULL DEFAULT 0,
          available_at TIMESTAMP NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMP,
          last_error VARCHAR(500),
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".integration_exceptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_account_id UUID REFERENCES public.channel_accounts(id) ON DELETE SET NULL,
          exception_type VARCHAR(100) NOT NULL,
          severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
          status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
          message VARCHAR(500) NOT NULL,
          context JSONB NOT NULL DEFAULT '{}'::jsonb,
          retry_count INT NOT NULL DEFAULT 0,
          resolved_by UUID,
          resolved_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".reconciliation_runs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_account_id UUID REFERENCES public.channel_accounts(id) ON DELETE SET NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
          started_at TIMESTAMP NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMP,
          findings_count INT NOT NULL DEFAULT 0,
          summary JSONB NOT NULL DEFAULT '{}'::jsonb
        )
      `);

      // Create indexes
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_master_skus_sku_code ON "${schemaName}".master_skus(sku_code)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_master_skus_category ON "${schemaName}".master_skus(category_id)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_inventory_master_sku ON "${schemaName}".inventory(master_sku_id)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_orders_order_number ON "${schemaName}".orders(order_number)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_orders_channel ON "${schemaName}".orders(channel)`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_account_external_order_unique ON "${schemaName}".orders(channel_account_id, external_order_id) WHERE channel_account_id IS NOT NULL`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_legacy_channel_external_order_unique ON "${schemaName}".orders(channel, external_order_id) WHERE channel_account_id IS NULL`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_webhook_inbox_status ON "${schemaName}".webhook_inbox(status, received_at)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_outbox_events_ready ON "${schemaName}".outbox_events(status, available_at)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON "${schemaName}".audit_logs(entity_type, entity_id)`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== Status Management ====================

  /**
   * Valid status transitions:
   * PENDING -> ACTIVE (after onboarding)
   * ACTIVE -> SUSPENDED
   * SUSPENDED -> ACTIVE (reactivate)
   * ACTIVE -> CANCELLED
   * SUSPENDED -> CANCELLED
   */
  private validateStatusTransition(
    from: TenantStatus,
    to: TenantStatus,
  ): boolean {
    const validTransitions: Record<TenantStatus, TenantStatus[]> = {
      [TenantStatus.PENDING]: [TenantStatus.ACTIVE],
      [TenantStatus.ACTIVE]: [TenantStatus.SUSPENDED, TenantStatus.CANCELLED],
      [TenantStatus.SUSPENDED]: [TenantStatus.ACTIVE, TenantStatus.CANCELLED],
      [TenantStatus.CANCELLED]: [], // Terminal state
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  async activateTenant(tenantId: string, userId: string): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);

    // Check permission
    const userRole = await this.getUserRoleInTenant(userId, tenantId);
    if (!userRole || userRole !== UserRole.OWNER) {
      throw new ForbiddenException('Only owner can activate tenant');
    }

    // Validate transition
    if (!this.validateStatusTransition(tenant.status, TenantStatus.ACTIVE)) {
      throw new BadRequestException(
        `Cannot activate tenant with status: ${tenant.status}`,
      );
    }

    tenant.status = TenantStatus.ACTIVE;
    tenant.isActive = true;
    tenant.suspendedAt = undefined;
    tenant.suspendedReason = undefined;

    return this.tenantRepository.save(tenant);
  }

  async suspendTenant(
    tenantId: string,
    userId: string,
    reason: string,
  ): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);

    // Check permission
    const userRole = await this.getUserRoleInTenant(userId, tenantId);
    if (!userRole || userRole !== UserRole.OWNER) {
      throw new ForbiddenException('Only owner can suspend tenant');
    }

    // Validate transition
    if (!this.validateStatusTransition(tenant.status, TenantStatus.SUSPENDED)) {
      throw new BadRequestException(
        `Cannot suspend tenant with status: ${tenant.status}`,
      );
    }

    tenant.status = TenantStatus.SUSPENDED;
    tenant.isActive = false;
    tenant.suspendedAt = new Date();
    tenant.suspendedReason = reason;

    return this.tenantRepository.save(tenant);
  }

  async cancelTenant(tenantId: string, userId: string): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);

    // Check permission
    const userRole = await this.getUserRoleInTenant(userId, tenantId);
    if (!userRole || userRole !== UserRole.OWNER) {
      throw new ForbiddenException('Only owner can cancel tenant');
    }

    // Validate transition
    if (!this.validateStatusTransition(tenant.status, TenantStatus.CANCELLED)) {
      throw new BadRequestException(
        `Cannot cancel tenant with status: ${tenant.status}`,
      );
    }

    tenant.status = TenantStatus.CANCELLED;
    tenant.isActive = false;
    tenant.cancelledAt = new Date();

    return this.tenantRepository.save(tenant);
  }

  async completeOnboarding(tenantId: string, userId: string): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);

    // Check permission
    const userRole = await this.getUserRoleInTenant(userId, tenantId);
    if (!userRole || userRole !== UserRole.OWNER) {
      throw new ForbiddenException('Only owner can complete onboarding');
    }

    // Can only complete onboarding for PENDING tenants
    if (tenant.status !== TenantStatus.PENDING) {
      throw new BadRequestException('Onboarding already completed');
    }

    tenant.status = TenantStatus.ACTIVE;
    tenant.isActive = true;
    tenant.onboardingCompleted = true;

    return this.tenantRepository.save(tenant);
  }

  async getTenantStatus(tenantId: string): Promise<{
    status: TenantStatus;
    isActive: boolean;
    onboardingCompleted: boolean;
    suspendedAt?: Date;
    suspendedReason?: string;
    cancelledAt?: Date;
  }> {
    const tenant = await this.getTenantById(tenantId);

    return {
      status: tenant.status,
      isActive: tenant.isActive,
      onboardingCompleted: tenant.onboardingCompleted,
      suspendedAt: tenant.suspendedAt,
      suspendedReason: tenant.suspendedReason,
      cancelledAt: tenant.cancelledAt,
    };
  }
}
