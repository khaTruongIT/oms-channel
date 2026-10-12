export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  INTEGRATION_EXCEPTION = 'INTEGRATION_EXCEPTION',
  BULK_JOB_DONE = 'BULK_JOB_DONE',
  SYSTEM = 'SYSTEM',
}

export enum NotificationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface NotificationRecord {
  id: string;
  type: string;
  severity: string;
  title: string;
  body: string;
  link: string | null;
  dedupe_key: string | null;
  read_at: Date | null;
  user_id: string | null;
  created_at: Date;
  updated_at: Date;
}
