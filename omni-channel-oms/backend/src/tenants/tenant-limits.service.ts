import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant, TenantPlan } from '../database/entities/tenant.entity';

export interface UsageStats {
  channels: { current: number; max: number; percentage: number };
  products: { current: number; max: number; percentage: number };
  warehouses: { current: number; max: number; percentage: number };
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  max: number;
  message?: string;
}

// Plan limits configuration
const PLAN_LIMITS: Record<
  TenantPlan,
  { channels: number; products: number; warehouses: number }
> = {
  [TenantPlan.FREE]: { channels: 3, products: 100, warehouses: 1 },
  [TenantPlan.STARTER]: { channels: 5, products: 500, warehouses: 3 },
  [TenantPlan.PROFESSIONAL]: { channels: 10, products: 2000, warehouses: 10 },
  [TenantPlan.ENTERPRISE]: { channels: -1, products: -1, warehouses: -1 }, // -1 means unlimited
};

@Injectable()
export class TenantLimitsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get the limits for a specific plan
   */
  getLimitsForPlan(plan: TenantPlan): {
    channels: number;
    products: number;
    warehouses: number;
  } {
    return PLAN_LIMITS[plan];
  }

  /**
   * Update tenant limits when plan changes
   */
  async updateLimitsForPlan(
    tenantId: string,
    plan: TenantPlan,
  ): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const limits = this.getLimitsForPlan(plan);
    tenant.plan = plan;
    tenant.maxChannels = limits.channels;
    tenant.maxProducts = limits.products;
    tenant.maxWarehouses = limits.warehouses;

    return this.tenantRepository.save(tenant);
  }

  /**
   * Get current usage statistics for a tenant
   */
  async getUsageStats(tenantId: string): Promise<UsageStats> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const schemaName = tenant.schemaName;

    // Count current usage from tenant schema
    const [productCount, warehouseCount, channelCount] = await Promise.all([
      this.countProducts(schemaName),
      this.countWarehouses(schemaName),
      this.countChannels(schemaName),
    ]);

    const calculatePercentage = (current: number, max: number): number => {
      if (max === -1) return 0; // Unlimited
      if (max === 0) return 100;
      return Math.round((current / max) * 100);
    };

    return {
      channels: {
        current: channelCount,
        max: tenant.maxChannels,
        percentage: calculatePercentage(channelCount, tenant.maxChannels),
      },
      products: {
        current: productCount,
        max: tenant.maxProducts,
        percentage: calculatePercentage(productCount, tenant.maxProducts),
      },
      warehouses: {
        current: warehouseCount,
        max: tenant.maxWarehouses,
        percentage: calculatePercentage(warehouseCount, tenant.maxWarehouses),
      },
    };
  }

  /**
   * Check if tenant can create a new product
   */
  async checkCanCreateProduct(tenantId: string): Promise<LimitCheckResult> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Unlimited check
    if (tenant.maxProducts === -1) {
      return { allowed: true, current: 0, max: -1 };
    }

    const currentCount = await this.countProducts(tenant.schemaName);

    if (currentCount >= tenant.maxProducts) {
      return {
        allowed: false,
        current: currentCount,
        max: tenant.maxProducts,
        message: `Product limit reached (${currentCount}/${tenant.maxProducts}). Upgrade your plan to add more products.`,
      };
    }

    return {
      allowed: true,
      current: currentCount,
      max: tenant.maxProducts,
    };
  }

  /**
   * Check if tenant can create a new warehouse
   */
  async checkCanCreateWarehouse(tenantId: string): Promise<LimitCheckResult> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Unlimited check
    if (tenant.maxWarehouses === -1) {
      return { allowed: true, current: 0, max: -1 };
    }

    const currentCount = await this.countWarehouses(tenant.schemaName);

    if (currentCount >= tenant.maxWarehouses) {
      return {
        allowed: false,
        current: currentCount,
        max: tenant.maxWarehouses,
        message: `Warehouse limit reached (${currentCount}/${tenant.maxWarehouses}). Upgrade your plan to add more warehouses.`,
      };
    }

    return {
      allowed: true,
      current: currentCount,
      max: tenant.maxWarehouses,
    };
  }

  /**
   * Check if tenant can connect a new channel
   */
  async checkCanCreateChannel(tenantId: string): Promise<LimitCheckResult> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Unlimited check
    if (tenant.maxChannels === -1) {
      return { allowed: true, current: 0, max: -1 };
    }

    const currentCount = await this.countChannels(tenant.schemaName);

    if (currentCount >= tenant.maxChannels) {
      return {
        allowed: false,
        current: currentCount,
        max: tenant.maxChannels,
        message: `Channel limit reached (${currentCount}/${tenant.maxChannels}). Upgrade your plan to connect more channels.`,
      };
    }

    return {
      allowed: true,
      current: currentCount,
      max: tenant.maxChannels,
    };
  }

  /**
   * Enforce product limit - throws if limit exceeded
   */
  async enforceProductLimit(tenantId: string): Promise<void> {
    const result = await this.checkCanCreateProduct(tenantId);
    if (!result.allowed) {
      throw new ForbiddenException(result.message);
    }
  }

  /**
   * Enforce warehouse limit - throws if limit exceeded
   */
  async enforceWarehouseLimit(tenantId: string): Promise<void> {
    const result = await this.checkCanCreateWarehouse(tenantId);
    if (!result.allowed) {
      throw new ForbiddenException(result.message);
    }
  }

  /**
   * Enforce channel limit - throws if limit exceeded
   */
  async enforceChannelLimit(tenantId: string): Promise<void> {
    const result = await this.checkCanCreateChannel(tenantId);
    if (!result.allowed) {
      throw new ForbiddenException(result.message);
    }
  }

  // ==================== Private Helper Methods ====================

  private async countProducts(schemaName: string): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM "${schemaName}".master_skus WHERE deleted_at IS NULL`,
      );
      return parseInt(result[0]?.count || '0', 10);
    } catch {
      return 0;
    }
  }

  private async countWarehouses(schemaName: string): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM "${schemaName}".warehouses WHERE is_active = true`,
      );
      return parseInt(result[0]?.count || '0', 10);
    } catch {
      return 0;
    }
  }

  private async countChannels(schemaName: string): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(DISTINCT channel) as count FROM "${schemaName}".channel_mappings`,
      );
      return parseInt(result[0]?.count || '0', 10);
    } catch {
      return 0;
    }
  }
}
