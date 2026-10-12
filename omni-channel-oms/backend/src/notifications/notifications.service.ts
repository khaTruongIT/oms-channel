import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  NotificationRecord,
  NotificationSeverity,
} from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

export interface PaginatedNotifications {
  items: NotificationRecord[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly dataSource: DataSource) {}

  async create(
    dto: CreateNotificationDto,
    schemaName: string,
  ): Promise<NotificationRecord> {
    const severity = dto.severity || NotificationSeverity.INFO;
    const link = dto.link || null;
    const dedupeKey = dto.dedupeKey || null;
    const userId = dto.userId || null;

    if (dedupeKey) {
      // Deduplicate by dedupe_key
      const insertSql = `
        INSERT INTO "${schemaName}".notifications
          (type, severity, title, body, link, dedupe_key, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (dedupe_key) DO NOTHING
        RETURNING *
      `;
      const inserted = (await this.dataSource.query(insertSql, [
        dto.type,
        severity,
        dto.title,
        dto.body,
        link,
        dedupeKey,
        userId,
      ])) as NotificationRecord[];

      if (inserted.length > 0) {
        return inserted[0];
      }

      // Already exists
      const existing = (await this.dataSource.query(
        `SELECT * FROM "${schemaName}".notifications WHERE dedupe_key = $1 LIMIT 1`,
        [dedupeKey],
      )) as NotificationRecord[];

      return existing[0];
    }

    // Direct insert without dedupeKey
    const insertSql = `
      INSERT INTO "${schemaName}".notifications
        (type, severity, title, body, link, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const res = (await this.dataSource.query(insertSql, [
      dto.type,
      severity,
      dto.title,
      dto.body,
      link,
      userId,
    ])) as NotificationRecord[];

    return res[0];
  }

  async findAll(
    query: QueryNotificationsDto,
    schemaName: string,
    userId?: string,
  ): Promise<PaginatedNotifications> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    const userCondition = userId
      ? `(user_id IS NULL OR user_id = '${userId.replace(/'/g, "''")}')`
      : `user_id IS NULL`;

    // 1. Get total unread count across tenant for user
    const unreadSql = `
      SELECT COUNT(*) AS count
      FROM "${schemaName}".notifications
      WHERE read_at IS NULL AND ${userCondition}
    `;
    const unreadRes = await this.dataSource.query(unreadSql);
    const unreadCount = Number(unreadRes[0]?.count || 0);

    // 2. Filter condition
    const filterConditions: string[] = [userCondition];
    if (query.unreadOnly) {
      filterConditions.push('read_at IS NULL');
    }
    const whereClause = filterConditions.join(' AND ');

    // 3. Count total matching
    const totalSql = `
      SELECT COUNT(*) AS count
      FROM "${schemaName}".notifications
      WHERE ${whereClause}
    `;
    const totalRes = await this.dataSource.query(totalSql);
    const total = Number(totalRes[0]?.count || 0);

    // 4. Query paginated items
    const itemsSql = `
      SELECT *
      FROM "${schemaName}".notifications
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const items = (await this.dataSource.query(itemsSql, [
      limit,
      offset,
    ])) as NotificationRecord[];

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async markAsRead(
    id: string,
    schemaName: string,
    userId?: string,
  ): Promise<NotificationRecord> {
    const userCondition = userId
      ? `AND (user_id IS NULL OR user_id = '${userId.replace(/'/g, "''")}')`
      : '';

    const updateSql = `
      UPDATE "${schemaName}".notifications
      SET read_at = NOW(), updated_at = NOW()
      WHERE id = $1 ${userCondition}
      RETURNING *
    `;
    const rows = (await this.dataSource.query(updateSql, [
      id,
    ])) as NotificationRecord[];

    if (rows.length === 0) {
      throw new NotFoundException('Không tìm thấy thông báo hoặc đã bị xóa');
    }

    return rows[0];
  }

  async markAllAsRead(
    schemaName: string,
    userId?: string,
  ): Promise<{ updatedCount: number }> {
    const userCondition = userId
      ? `AND (user_id IS NULL OR user_id = '${userId.replace(/'/g, "''")}')`
      : '';

    const updateSql = `
      UPDATE "${schemaName}".notifications
      SET read_at = NOW(), updated_at = NOW()
      WHERE read_at IS NULL ${userCondition}
      RETURNING id
    `;
    const rows = (await this.dataSource.query(updateSql)) as Array<{ id: string }>;

    return { updatedCount: rows.length };
  }
}
