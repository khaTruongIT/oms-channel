import {
  Injectable,
  NotFoundException,
  BadRequestException,
  PayloadTooLargeException,
  Logger,
  Optional,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import {
  BulkJobType,
  BulkJobStatus,
  BulkJobError,
  BulkJobRecord,
} from './entities/bulk-job.entity';
import { CreateBulkJobDto } from './dto/create-bulk-job.dto';
import { TenantLimitsService } from '../tenants/tenant-limits.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationSeverity,
} from '../notifications/entities/notification.entity';

const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const BATCH_SIZE = 100;
const STUCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export interface ValidationResult {
  valid: boolean;
  summary: {
    total: number;
    validCount: number;
    invalidCount: number;
  };
  errors: BulkJobError[];
  dryRun?: boolean;
}

@Injectable()
export class BulkJobsService {
  private readonly logger = new Logger(BulkJobsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantLimitsService: TenantLimitsService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  async validateRows(
    type: BulkJobType,
    rows: Record<string, any>[],
    schemaName: string,
    queryRunner?: QueryRunner,
  ): Promise<ValidationResult> {
    const runner = queryRunner || this.dataSource.createQueryRunner();
    const shouldRelease = !queryRunner;
    if (shouldRelease) {
      await runner.connect();
    }

    const errors: BulkJobError[] = [];

    try {
      // Pre-fetch warehouse map if needed
      const warehouseIds = new Set<string>();
      if (type === BulkJobType.INVENTORY_IMPORT) {
        const warehouses = (await runner.query(
          `SELECT id, name FROM "${schemaName}".warehouses WHERE is_active = true`,
        )) as Array<{ id: string; name: string }>;
        for (const w of warehouses) {
          warehouseIds.add(w.id);
          warehouseIds.add(w.name.toLowerCase());
        }
      }

      // Pre-fetch reserved stock per SKU if checking deletion
      const reservedStockMap = new Map<string, number>();
      if (type === BulkJobType.PRODUCT_DELETE) {
        const reservedRows = (await runner.query(
          `SELECT m.sku_code, COALESCE(SUM(i.reserved_quantity), 0) AS total_reserved
           FROM "${schemaName}".master_skus m
           LEFT JOIN "${schemaName}".inventory i ON i.master_sku_id = m.id
           GROUP BY m.sku_code`,
        )) as Array<{ sku_code: string; total_reserved: string | number }>;
        for (const r of reservedRows) {
          reservedStockMap.set(r.sku_code, Number(r.total_reserved));
        }
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;

        if (type === BulkJobType.EXPORT) {
          const entity = String(row.entity || 'orders').toLowerCase();
          if (!['orders', 'products', 'customers', 'inventory'].includes(entity)) {
            errors.push({
              row: rowNum,
              field: 'entity',
              message: 'Đối tượng xuất dữ liệu không hợp lệ (hỗ trợ: orders, products, customers, inventory)',
            });
          }
        } else if (type === BulkJobType.PRODUCT_IMPORT) {
          const sku = String(row.sku || row.sku_code || row.skuCode || '').trim();
          const name = String(row.name || row.product_name || row.productName || '').trim();
          const price = row.price !== undefined && row.price !== null && row.price !== '' ? Number(row.price) : undefined;

          if (!sku) {
            errors.push({
              row: rowNum,
              field: 'sku',
              message: 'Mã SKU không được để trống',
            });
          }
          if (!name) {
            errors.push({
              row: rowNum,
              field: 'name',
              message: 'Tên sản phẩm không được để trống',
              sku,
            });
          }
          if (price !== undefined && (isNaN(price) || price < 0)) {
            errors.push({
              row: rowNum,
              field: 'price',
              message: 'Giá sản phẩm phải là số không âm',
              sku,
            });
          }
        } else if (type === BulkJobType.INVENTORY_IMPORT) {
          const sku = String(row.sku || row.sku_code || row.skuCode || '').trim();
          const warehouse = String(row.warehouse || row.warehouse_id || row.warehouseId || '').trim();
          const quantity = Number(row.quantity);

          if (!sku) {
            errors.push({
              row: rowNum,
              field: 'sku',
              message: 'Mã SKU không được để trống',
            });
          }
          if (!warehouse) {
            errors.push({
              row: rowNum,
              field: 'warehouse',
              message: 'Kho hàng không được để trống',
              sku,
            });
          } else if (
            warehouseIds.size > 0 &&
            !warehouseIds.has(warehouse) &&
            !warehouseIds.has(warehouse.toLowerCase())
          ) {
            errors.push({
              row: rowNum,
              field: 'warehouse',
              message: `Kho hàng "${warehouse}" không tồn tại hoặc đã ngưng hoạt động`,
              sku,
            });
          }
          if (isNaN(quantity) || quantity < 0) {
            errors.push({
              row: rowNum,
              field: 'quantity',
              message: 'Số lượng tồn kho phải là số nguyên không âm',
              sku,
            });
          }
        } else if (type === BulkJobType.PRODUCT_DELETE) {
          const sku = String(row.sku || row.sku_code || row.skuCode || '').trim();
          if (!sku) {
            errors.push({
              row: rowNum,
              field: 'sku',
              message: 'Mã SKU không được để trống',
            });
          } else {
            const reserved = reservedStockMap.get(sku) || 0;
            if (reserved > 0) {
              errors.push({
                row: rowNum,
                field: 'sku',
                message: `Không thể xóa SKU còn ${reserved} tồn kho đã được đặt trước (reserved)`,
                sku,
              });
            }
          }
        }
      }
    } finally {
      if (shouldRelease) {
        await runner.release();
      }
    }

    const total = rows.length;
    const invalidCount = new Set(errors.map((e) => e.row)).size;
    const validCount = Math.max(0, total - invalidCount);

    return {
      valid: errors.length === 0,
      summary: {
        total,
        validCount,
        invalidCount,
      },
      errors,
    };
  }

  async createJob(
    dto: CreateBulkJobDto,
    schemaName: string,
    userId?: string,
  ): Promise<any> {
    const jsonString = JSON.stringify(dto.rows);
    if (Buffer.byteLength(jsonString, 'utf8') > MAX_PAYLOAD_BYTES) {
      throw new PayloadTooLargeException('Dữ liệu nhập vượt quá giới hạn 5MB');
    }

    // Check stuck jobs older than 15 minutes
    await this.cleanupStuckJobs(schemaName);

    // Dry run mode
    if (dto.dryRun) {
      const validation = await this.validateRows(dto.type, dto.rows, schemaName);
      return {
        ...validation,
        dryRun: true,
      };
    }

    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = (await this.dataSource.query(
        `SELECT * FROM "${schemaName}".bulk_jobs WHERE idempotency_key = $1 LIMIT 1`,
        [dto.idempotencyKey],
      )) as BulkJobRecord[];

      if (existing.length > 0) {
        return this.formatJobResponse(existing[0]);
      }
    }

    // Check tenant quota
    if (dto.type === BulkJobType.PRODUCT_IMPORT) {
      const currentProductsCount = await this.dataSource.query(
        `SELECT COUNT(*) AS count FROM "${schemaName}".master_skus WHERE deleted_at IS NULL`,
      );
      const currentCount = Number(currentProductsCount[0]?.count || 0);
      const tenant = await this.dataSource.query(
        `SELECT id, plan FROM public.tenants WHERE schema_name = $1 LIMIT 1`,
        [schemaName],
      );
      if (tenant.length > 0) {
        const limits = this.tenantLimitsService.getLimitsForPlan(tenant[0].plan);
        if (
          limits &&
          limits.products !== -1 &&
          currentCount + dto.rows.length > limits.products
        ) {
          throw new BadRequestException({
            code: 'BULK_LIMIT_EXCEEDED',
            message: `Số lượng sản phẩm sau khi nhập (${currentCount + dto.rows.length}) vượt quá giới hạn gói ${tenant[0].plan} (${limits.products})`,
          });
        }
      }
    }

    // Insert job into database
    const insertResult = (await this.dataSource.query(
      `INSERT INTO "${schemaName}".bulk_jobs
       (type, status, total, processed, failed, error_report, payload, idempotency_key, started_at)
       VALUES ($1, 'PROCESSING', $2, 0, 0, '[]'::jsonb, $3, $4, NOW())
       RETURNING *`,
      [
        dto.type,
        dto.rows.length,
        JSON.stringify(dto.rows),
        dto.idempotencyKey || null,
      ],
    )) as BulkJobRecord[];

    const job = insertResult[0];

    // Process rows in batches of 100
    await this.processJobBatches(job.id, dto.type, dto.rows, schemaName, userId);

    // Return fresh state
    const finishedJob = await this.getJob(job.id, schemaName);
    return this.formatJobResponse(finishedJob);
  }

  private async processJobBatches(
    jobId: string,
    type: BulkJobType,
    rows: Record<string, any>[],
    schemaName: string,
    userId?: string,
  ): Promise<void> {
    if (type === BulkJobType.EXPORT) {
      await this.processExportJob(jobId, rows, schemaName, userId);
      return;
    }

    const allErrors: BulkJobError[] = [];
    let processedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        for (let j = 0; j < chunk.length; j++) {
          const row = chunk[j];
          const globalRowNum = i + j + 1;

          try {
            await this.executeSingleRow(
              type,
              row,
              globalRowNum,
              schemaName,
              queryRunner,
              userId,
            );
            processedCount++;
          } catch (err: any) {
            failedCount++;
            allErrors.push({
              row: globalRowNum,
              sku: String(row.sku || row.sku_code || ''),
              message: err?.message || 'Lỗi xử lý dòng',
            });
          }
        }

        await queryRunner.commitTransaction();
      } catch (batchErr: any) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Batch error at row ${i + 1}: ${batchErr?.message}`);
        for (let j = 0; j < chunk.length; j++) {
          failedCount++;
          allErrors.push({
            row: i + j + 1,
            sku: String(chunk[j].sku || ''),
            message: `Lỗi giao dịch batch: ${batchErr?.message || 'Transaction error'}`,
          });
        }
      } finally {
        await queryRunner.release();
      }
    }

    const finalStatus =
      failedCount === rows.length
        ? BulkJobStatus.FAILED
        : BulkJobStatus.COMPLETED;

    await this.dataSource.query(
      `UPDATE "${schemaName}".bulk_jobs
       SET status = $1,
           processed = $2,
           failed = $3,
           error_report = $4,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $5`,
      [
        finalStatus,
        processedCount,
        failedCount,
        JSON.stringify(allErrors),
        jobId,
      ],
    );

    if (this.notificationsService) {
      const dedupeKey = `BULK_JOB_DONE:${jobId}`;
      try {
        await this.notificationsService.create(
          {
            type: NotificationType.BULK_JOB_DONE,
            severity:
              failedCount > 0
                ? NotificationSeverity.WARNING
                : NotificationSeverity.INFO,
            title: `Tiến trình xử lý hàng loạt hoàn tất`,
            body: `Tiến trình ${type} đã hoàn tất: ${processedCount} thành công, ${failedCount} lỗi.`,
            link: '/bulk-operations',
            dedupeKey,
            userId,
          },
          schemaName,
        );
      } catch (err: any) {
        this.logger.warn(
          `Failed to dispatch BULK_JOB_DONE notification: ${err?.message}`,
        );
      }
    }
  }

  private async executeSingleRow(
    type: BulkJobType,
    row: Record<string, any>,
    rowNum: number,
    schemaName: string,
    queryRunner: QueryRunner,
    userId?: string,
  ): Promise<void> {
    if (type === BulkJobType.PRODUCT_IMPORT) {
      const sku = String(row.sku || row.sku_code || '').trim();
      const name = String(row.name || row.product_name || '').trim();
      const price = Number(row.price || 0);

      if (!sku || !name) {
        throw new Error('Thiếu SKU hoặc tên sản phẩm');
      }

      await queryRunner.query(
        `INSERT INTO "${schemaName}".master_skus (sku_code, product_name, cost_price)
         VALUES ($1, $2, $3)
         ON CONFLICT (sku_code)
         DO UPDATE SET product_name = EXCLUDED.product_name,
                       cost_price = EXCLUDED.cost_price,
                       deleted_at = NULL`,
        [sku, name, price],
      );
    } else if (type === BulkJobType.INVENTORY_IMPORT) {
      const sku = String(row.sku || row.sku_code || '').trim();
      const warehouseRef = String(row.warehouse || row.warehouse_id || '').trim();
      const quantity = Number(row.quantity);

      if (!sku || !warehouseRef || isNaN(quantity) || quantity < 0) {
        throw new Error('Dữ liệu tồn kho không hợp lệ');
      }

      // Find warehouse ID
      const warehouses = (await queryRunner.query(
        `SELECT id FROM "${schemaName}".warehouses
         WHERE (id::text = $1 OR LOWER(name) = LOWER($1)) AND is_active = true
         LIMIT 1`,
        [warehouseRef],
      )) as Array<{ id: string }>;

      if (warehouses.length === 0) {
        throw new Error(`Không tìm thấy kho hàng "${warehouseRef}"`);
      }
      const warehouseId = warehouses[0].id;

      // Find master SKU
      const skus = (await queryRunner.query(
        `SELECT id FROM "${schemaName}".master_skus WHERE sku_code = $1 LIMIT 1`,
        [sku],
      )) as Array<{ id: string }>;

      if (skus.length === 0) {
        throw new Error(`SKU "${sku}" không tồn tại trong hệ thống`);
      }
      const masterSkuId = skus[0].id;

      // Upsert inventory
      const invRows = (await queryRunner.query(
        `INSERT INTO "${schemaName}".inventory (master_sku_id, warehouse_id, quantity, reserved_quantity, safety_stock)
         VALUES ($1, $2, $3, 0, 0)
         ON CONFLICT (master_sku_id, warehouse_id)
         DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()
         RETURNING id, quantity`,
        [masterSkuId, warehouseId, quantity],
      )) as Array<{ id: string; quantity: number }>;

      // Record movement
      const idempotencyKey = `bulk-import:${masterSkuId}:${warehouseId}:${rowNum}:${Date.now()}`;
      await queryRunner.query(
        `INSERT INTO "${schemaName}".inventory_movements
         (inventory_id, master_sku_id, warehouse_id, movement_type, quantity_delta, reserved_delta, idempotency_key, actor_user_id, metadata)
         VALUES ($1, $2, $3, 'IMPORT', $4, 0, $5, $6, $7)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          invRows[0].id,
          masterSkuId,
          warehouseId,
          quantity,
          idempotencyKey,
          userId || null,
          JSON.stringify({ source: 'BULK_IMPORT', row: rowNum }),
        ],
      );
    } else if (type === BulkJobType.PRODUCT_DELETE) {
      const sku = String(row.sku || row.sku_code || '').trim();
      if (!sku) throw new Error('Mã SKU không được để trống');

      // Check reserved quantity
      const invCheck = (await queryRunner.query(
        `SELECT COALESCE(SUM(i.reserved_quantity), 0) AS reserved
         FROM "${schemaName}".master_skus m
         JOIN "${schemaName}".inventory i ON i.master_sku_id = m.id
         WHERE m.sku_code = $1`,
        [sku],
      )) as Array<{ reserved: string | number }>;

      if (invCheck.length > 0 && Number(invCheck[0].reserved) > 0) {
        throw new Error(`SKU có ${invCheck[0].reserved} tồn kho đang được đặt trước`);
      }

      // Soft delete product
      await queryRunner.query(
        `UPDATE "${schemaName}".master_skus
         SET deleted_at = NOW()
         WHERE sku_code = $1`,
        [sku],
      );
    }
  }

  async getJob(jobId: string, schemaName: string): Promise<BulkJobRecord> {
    const rows = (await this.dataSource.query(
      `SELECT * FROM "${schemaName}".bulk_jobs WHERE id = $1 LIMIT 1`,
      [jobId],
    )) as BulkJobRecord[];

    if (rows.length === 0) {
      throw new NotFoundException('Không tìm thấy tiến trình Bulk Job');
    }

    return rows[0];
  }

  async getJobErrorsCsv(jobId: string, schemaName: string): Promise<string> {
    const job = await this.getJob(jobId, schemaName);
    const errors: BulkJobError[] = job.error_report || [];

    const lines = ['Dòng,SKU,Trường,Chi tiết lỗi'];
    for (const err of errors) {
      const rowStr = err.row;
      const skuStr = `"${(err.sku || '').replace(/"/g, '""')}"`;
      const fieldStr = `"${(err.field || '').replace(/"/g, '""')}"`;
      const msgStr = `"${(err.message || '').replace(/"/g, '""')}"`;
      lines.push(`${rowStr},${skuStr},${fieldStr},${msgStr}`);
    }

    return '\uFEFF' + lines.join('\n'); // Prepend UTF-8 BOM for Excel compatibility
  }

  async getJobExportCsv(jobId: string, schemaName: string): Promise<string> {
    const job = await this.getJob(jobId, schemaName);
    const csv = job.payload?.csv;
    if (!csv) {
      throw new NotFoundException('Dữ liệu xuất CSV chưa sẵn sàng hoặc không tồn tại');
    }
    return csv;
  }

  private async processExportJob(
    jobId: string,
    rows: Record<string, any>[],
    schemaName: string,
    userId?: string,
  ): Promise<void> {
    const entity = String(rows[0]?.entity || 'orders').toLowerCase();
    let csvContent = '\uFEFF';
    let exportCount = 0;

    if (entity === 'products') {
      const productRows = (await this.dataSource.query(
        `SELECT sku_code, product_name, cost_price, created_at
         FROM "${schemaName}".master_skus
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 50000`,
      )) as any[];
      exportCount = productRows.length;
      const lines = ['Mã SKU,Tên sản phẩm,Giá vốn,Ngày tạo'];
      for (const p of productRows) {
        lines.push(
          `"${p.sku_code}","${(p.product_name || '').replace(/"/g, '""')}",${p.cost_price || 0},"${p.created_at}"`,
        );
      }
      csvContent += lines.join('\n');
    } else if (entity === 'customers') {
      const custRows = (await this.dataSource.query(
        `SELECT full_name, phone, email, total_orders, total_spent, last_order_at
         FROM "${schemaName}".customers
         ORDER BY total_spent DESC
         LIMIT 50000`,
      )) as any[];
      exportCount = custRows.length;
      const lines = ['Họ tên,SĐT,Email,Tổng đơn,Tổng chi tiêu,Đơn gần nhất'];
      for (const c of custRows) {
        lines.push(
          `"${(c.full_name || '').replace(/"/g, '""')}","${c.phone || ''}","${c.email || ''}",${c.total_orders || 0},${c.total_spent || 0},"${c.last_order_at || ''}"`,
        );
      }
      csvContent += lines.join('\n');
    } else if (entity === 'inventory') {
      const invRows = (await this.dataSource.query(
        `SELECT m.sku_code, m.product_name, w.name AS warehouse_name, i.quantity, i.reserved_quantity, i.safety_stock
         FROM "${schemaName}".inventory i
         JOIN "${schemaName}".master_skus m ON m.id = i.master_sku_id
         JOIN "${schemaName}".warehouses w ON w.id = i.warehouse_id
         LIMIT 50000`,
      )) as any[];
      exportCount = invRows.length;
      const lines = ['Mã SKU,Tên sản phẩm,Kho hàng,Tồn thực tế,Đang giữ,Tồn an toàn'];
      for (const i of invRows) {
        lines.push(
          `"${i.sku_code}","${(i.product_name || '').replace(/"/g, '""')}","${i.warehouse_name}",${i.quantity || 0},${i.reserved_quantity || 0},${i.safety_stock || 0}`,
        );
      }
      csvContent += lines.join('\n');
    } else {
      // Default: orders
      const orderRows = (await this.dataSource.query(
        `SELECT order_number, channel, status, total_amount, customer_name, customer_phone, created_at
         FROM "${schemaName}".orders
         ORDER BY created_at DESC
         LIMIT 50000`,
      )) as any[];
      exportCount = orderRows.length;
      const lines = ['Mã đơn,Kênh,Trạng thái,Tổng tiền,Khách hàng,SĐT,Ngày tạo'];
      for (const o of orderRows) {
        lines.push(
          `"${o.order_number}","${o.channel}","${o.status}",${o.total_amount || 0},"${(o.customer_name || '').replace(/"/g, '""')}","${o.customer_phone || ''}","${o.created_at}"`,
        );
      }
      csvContent += lines.join('\n');
    }

    await this.dataSource.query(
      `UPDATE "${schemaName}".bulk_jobs
       SET status = 'COMPLETED',
           processed = $1,
           failed = 0,
           payload = jsonb_build_object('csv', $2, 'entity', $3, 'count', $1),
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4`,
      [exportCount, csvContent, entity, jobId],
    );

    if (this.notificationsService) {
      try {
        await this.notificationsService.create(
          {
            type: NotificationType.BULK_JOB_DONE,
            severity: NotificationSeverity.INFO,
            title: `Xuất dữ liệu ${entity} hoàn tất`,
            body: `Đã xuất thành công ${exportCount} bản ghi sang file CSV.`,
            link: `/api/bulk-jobs/${jobId}/export.csv`,
            userId,
          },
          schemaName,
        );
      } catch (e) {
        this.logger.warn(`Failed to dispatch export notification: ${e?.message}`);
      }
    }
  }

  private async cleanupStuckJobs(schemaName: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE "${schemaName}".bulk_jobs
       SET status = 'FAILED',
           error_report = jsonb_build_array(jsonb_build_object('row', 0, 'message', 'Tiến trình bị gián đoạn do quá thời gian 15 phút')),
           completed_at = NOW()
       WHERE status = 'PROCESSING'
         AND started_at < NOW() - INTERVAL '15 minutes'`,
    );
  }

  private formatJobResponse(job: BulkJobRecord) {
    return {
      id: job.id,
      type: job.type,
      status: job.status,
      total: Number(job.total || 0),
      processed: Number(job.processed || 0),
      failed: Number(job.failed || 0),
      errorCount: Array.isArray(job.error_report) ? job.error_report.length : 0,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      createdAt: job.created_at,
    };
  }
}
