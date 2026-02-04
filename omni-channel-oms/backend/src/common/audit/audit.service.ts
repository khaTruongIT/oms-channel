import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly dataSource: DataSource) {}

  async log(entry: AuditLogEntry, schemaName: string): Promise<void> {
    const {
      userId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress,
      userAgent,
    } = entry;

    await this.dataSource.query(
      `INSERT INTO "${schemaName}".audit_logs 
       (user_id, action, entity_type, entity_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId || null,
        action,
        entityType,
        entityId,
        JSON.stringify(changes),
        ipAddress || null,
        userAgent || null,
      ],
    );
  }

  async getAuditLogs(
    schemaName: string,
    filters?: {
      entityType?: string;
      entityId?: string;
      userId?: string;
      action?: string;
      limit?: number;
    },
  ): Promise<any[]> {
    let query = `SELECT * FROM "${schemaName}".audit_logs WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.entityType) {
      query += ` AND entity_type = $${paramIndex++}`;
      params.push(filters.entityType);
    }

    if (filters?.entityId) {
      query += ` AND entity_id = $${paramIndex++}`;
      params.push(filters.entityId);
    }

    if (filters?.userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(filters.userId);
    }

    if (filters?.action) {
      query += ` AND action = $${paramIndex++}`;
      params.push(filters.action);
    }

    query += ` ORDER BY created_at DESC`;

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
    } else {
      query += ` LIMIT 100`;
    }

    return this.dataSource.query(query, params);
  }

  async getEntityHistory(
    entityType: string,
    entityId: string,
    schemaName: string,
  ): Promise<any[]> {
    return this.dataSource.query(
      `SELECT * FROM "${schemaName}".audit_logs 
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY created_at DESC`,
      [entityType, entityId],
    );
  }
}
