import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChannelAccountsService } from '../channel-accounts/channel-accounts.service';
import { ChannelMappingsService } from '../channel-mappings/channel-mappings.service';
import { OrdersService } from '../orders/orders.service';
import { ErrorCode } from '../common/errors/error-codes';

type ExceptionStatus = 'OPEN' | 'RETRYING' | 'RESOLVED';
type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface IntegrationExceptionRow {
  id: string;
  channel_account_id: string | null;
  exception_type: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  message: string;
  context: Record<string, unknown>;
  retry_count: number | string;
  created_at: Date | string;
  updated_at: Date | string;
  resolved_at: Date | string | null;
}

export interface IntegrationException {
  id: string;
  channelAccountId?: string;
  type: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  message: string;
  context: Record<string, unknown>;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface IntegrationHealth {
  webhookIngestionRate: number;
  duplicateCount: number;
  syncLagSeconds?: number;
  stockDrift: null;
  exceptionAgingHours?: number;
  lastReconciliationAt?: Date;
}

@Injectable()
export class IntegrationOperationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly channelAccountsService: ChannelAccountsService,
    @Optional()
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService?: OrdersService,
    @Optional()
    @Inject(forwardRef(() => ChannelMappingsService))
    private readonly channelMappingsService?: ChannelMappingsService,
  ) {}

  async createException(
    schemaName: string,
    input: {
      channelAccountId?: string;
      type: string;
      severity: ExceptionSeverity;
      message: string;
      context?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO "${schemaName}".integration_exceptions
       (channel_account_id, exception_type, severity, message, context)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        input.channelAccountId ?? null,
        input.type,
        input.severity,
        input.message,
        JSON.stringify(input.context ?? {}),
      ],
    );
  }

  async listExceptions(
    schemaName: string,
    filters: { status?: ExceptionStatus; severity?: ExceptionSeverity },
  ): Promise<IntegrationException[]> {
    const clauses: string[] = [];
    const params: string[] = [];
    if (filters.status) {
      params.push(filters.status);
      clauses.push(`status = $${params.length}`);
    }
    if (filters.severity) {
      params.push(filters.severity);
      clauses.push(`severity = $${params.length}`);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await this.dataSource.query<IntegrationExceptionRow[]>(
      `SELECT * FROM "${schemaName}".integration_exceptions ${where} ORDER BY created_at DESC LIMIT 100`,
      params,
    );
    return rows.map((row) => this.mapException(row));
  }

  async retryException(
    id: string,
    schemaName: string,
  ): Promise<IntegrationException> {
    // S3.1.5: Atomic lock preventing concurrent retry execution
    const lockedRows = await this.dataSource.query<IntegrationExceptionRow[]>(
      `UPDATE "${schemaName}".integration_exceptions
       SET status = 'RETRYING', updated_at = NOW()
       WHERE id = $1 AND status <> 'RETRYING'
       RETURNING *`,
      [id],
    );

    if (lockedRows.length === 0) {
      const existing = await this.dataSource.query<IntegrationExceptionRow[]>(
        `SELECT * FROM "${schemaName}".integration_exceptions WHERE id = $1`,
        [id],
      );
      if (existing.length === 0) {
        throw new NotFoundException('Integration exception not found');
      }
      if (existing[0].status === 'RETRYING') {
        throw new ConflictException(
          'Integration exception is currently being retried',
        );
      }
      return this.mapException(existing[0]);
    }

    const exRow = lockedRows[0];
    const context = (
      typeof exRow.context === 'string'
        ? JSON.parse(exRow.context)
        : exRow.context ?? {}
    ) as Record<string, any>;

    // Real execution / retry task
    try {
      if (
        exRow.exception_type === ErrorCode.UNMAPPED_SKU &&
        this.channelMappingsService &&
        this.ordersService
      ) {
        const { channel, itemId, variantId, orderId, quantity, price, customerName, customerPhone } = context;

        if (channel && itemId) {
          const masterSkuId =
            await this.channelMappingsService.findMasterSkuByExternalId(
              channel,
              itemId,
              variantId || null,
              schemaName,
            );

          if (!masterSkuId) {
            throw new Error(`Product mapping still missing for item ${itemId}`);
          }

          const warehouses = await this.dataSource.query<
            Array<{ id: string }>
          >(
            `SELECT id FROM "${schemaName}".warehouses WHERE is_active = TRUE LIMIT 1`,
          );
          if (warehouses.length === 0) {
            throw new NotFoundException('No active warehouse found');
          }

          try {
            await this.ordersService.createOrder(
              {
                channel,
                externalOrderId: orderId,
                customerName: customerName || 'Unknown Customer',
                customerPhone: customerPhone || 'N/A',
                items: [
                  {
                    masterSkuId,
                    quantity: quantity || 1,
                    unitPrice: price || 0,
                  },
                ],
                warehouseId: warehouses[0].id,
              },
              '00000000-0000-0000-0000-000000000001',
              schemaName,
            );
          } catch (err: unknown) {
            const isDuplicate =
              err instanceof Error && err.message.includes('already exists');
            const isDuplicateCode =
              (err as any)?.response?.code === ErrorCode.ORDER_DUPLICATE;
            if (!isDuplicate && !isDuplicateCode) {
              throw err;
            }
          }
        }
      }

      // Success: mark RESOLVED
      const resolvedRows = await this.dataSource.query<
        IntegrationExceptionRow[]
      >(
        `UPDATE "${schemaName}".integration_exceptions
         SET status = 'RESOLVED', resolved_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id],
      );
      return this.mapException(resolvedRows[0]);
    } catch (err: unknown) {
      // S3.1.5: Failure: return to OPEN and increment retry_count
      const failedRows = await this.dataSource.query<
        IntegrationExceptionRow[]
      >(
        `UPDATE "${schemaName}".integration_exceptions
         SET status = 'OPEN', retry_count = retry_count + 1, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id],
      );
      return this.mapException(failedRows[0]);
    }
  }

  async mapSkuAndRetry(
    id: string,
    masterSkuId: string,
    schemaName: string,
    tenantId?: string,
  ): Promise<IntegrationException> {
    const existing = await this.dataSource.query<IntegrationExceptionRow[]>(
      `SELECT * FROM "${schemaName}".integration_exceptions WHERE id = $1`,
      [id],
    );
    if (existing.length === 0) {
      throw new NotFoundException('Integration exception not found');
    }
    const row = existing[0];
    const context = (
      typeof row.context === 'string'
        ? JSON.parse(row.context)
        : row.context ?? {}
    ) as Record<string, any>;

    if (this.channelMappingsService && context.channel && context.itemId) {
      try {
        await this.channelMappingsService.createMapping(
          {
            masterSkuId,
            channel: context.channel,
            externalItemId: context.itemId,
            externalVariantId: context.variantId || undefined,
            channelAccountId: row.channel_account_id || undefined,
          },
          schemaName,
          tenantId,
        );
      } catch (err: unknown) {
        if (!(err instanceof ConflictException)) {
          throw err;
        }
      }
    }

    return this.retryException(id, schemaName);
  }

  async resolveException(
    id: string,
    userId: string,
    schemaName: string,
  ): Promise<IntegrationException> {
    return this.updateException(
      id,
      schemaName,
      `UPDATE "${schemaName}".integration_exceptions
       SET status = 'RESOLVED', resolved_by = $2, resolved_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, userId],
    );
  }

  async triggerReconciliation(
    schemaName: string,
    tenantId: string,
    channelAccountId?: string,
  ): Promise<{ id: string; status: string }> {
    if (channelAccountId) {
      await this.channelAccountsService.getForTenant(
        channelAccountId,
        tenantId,
      );
    }
    const rows = await this.dataSource.query<
      Array<{ id: string; status: string }>
    >(
      `INSERT INTO "${schemaName}".reconciliation_runs
       (channel_account_id, status, completed_at, summary)
       VALUES ($1, 'BLOCKED_CONTRACT', NOW(), $2)
       RETURNING id, status`,
      [
        channelAccountId ?? null,
        JSON.stringify({
          message:
            'Reconciliation is blocked until the official Shopee Partner contract is configured',
        }),
      ],
    );
    return rows[0];
  }

  async getHealth(schemaName: string): Promise<IntegrationHealth> {
    const [webhookMetrics, exceptionMetrics, reconciliation] =
      await Promise.all([
        this.dataSource.query<
          Array<{ accepted: string | number; duplicates: string | number }>
        >(
          `SELECT
           COUNT(*) FILTER (WHERE status IN ('RECEIVED', 'PROCESSED')) AS accepted,
           COUNT(*) FILTER (WHERE status = 'DUPLICATE') AS duplicates
         FROM "${schemaName}".webhook_inbox
         WHERE received_at >= NOW() - INTERVAL '24 hours'`,
        ),
        this.dataSource.query<Array<{ aging_hours: string | number | null }>>(
          `SELECT EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 3600 AS aging_hours
         FROM "${schemaName}".integration_exceptions
         WHERE status <> 'RESOLVED'`,
        ),
        this.dataSource.query<Array<{ completed_at: Date | string | null }>>(
          `SELECT completed_at FROM "${schemaName}".reconciliation_runs
         WHERE completed_at IS NOT NULL
         ORDER BY completed_at DESC LIMIT 1`,
        ),
      ]);

    const metrics = webhookMetrics[0] ?? { accepted: 0, duplicates: 0 };
    const oldestException = exceptionMetrics[0]?.aging_hours;
    const lastReconciliation = reconciliation[0]?.completed_at;

    return {
      webhookIngestionRate: Number(metrics.accepted),
      duplicateCount: Number(metrics.duplicates),
      stockDrift: null,
      exceptionAgingHours:
        oldestException === null || oldestException === undefined
          ? undefined
          : Number(oldestException),
      lastReconciliationAt: lastReconciliation
        ? new Date(lastReconciliation)
        : undefined,
    };
  }

  private async updateException(
    id: string,
    schemaName: string,
    query: string,
    parameters: string[],
  ): Promise<IntegrationException> {
    const rows = await this.dataSource.query<IntegrationExceptionRow[]>(
      query,
      parameters,
    );
    if (rows.length === 0) {
      throw new NotFoundException('Integration exception not found');
    }
    return this.mapException(rows[0]);
  }

  private mapException(row: IntegrationExceptionRow): IntegrationException {
    return {
      id: row.id,
      channelAccountId: row.channel_account_id ?? undefined,
      type: row.exception_type,
      severity: row.severity,
      status: row.status,
      message: row.message,
      context: this.redactContext(row.context),
      retryCount: Number(row.retry_count),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
    };
  }

  private redactContext(
    context: Record<string, unknown>,
  ): Record<string, unknown> {
    return this.redactValue(context) as Record<string, unknown>;
  }

  private redactValue(value: unknown, key = ''): unknown {
    const sensitiveKey =
      /(authorization|credential|password|phone|token|secret|email|address|cookie)/i.test(
        key,
      );
    if (sensitiveKey) {
      return '[REDACTED]';
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.redactValue(item));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([nestedKey, nestedValue]) => [
          nestedKey,
          this.redactValue(nestedValue, nestedKey),
        ]),
      );
    }
    return value;
  }
}
