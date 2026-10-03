export type ChannelAccountStatus =
  | "PENDING_CONTRACT"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

export interface ChannelAccount {
  id: string;
  provider: string;
  shopId?: string;
  shopName?: string;
  status: ChannelAccountStatus;
  tokenExpiresAt?: string | null;
  webhookCallbackId: string;
  lastConnectedAt?: string | null;
  lastError?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateShopeeAccountInput {
  shopId: string;
  shopName?: string;
}

export type IntegrationExceptionStatus = "OPEN" | "RETRYING" | "RESOLVED";
export type IntegrationExceptionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IntegrationException {
  id: string;
  type: string;
  severity: IntegrationExceptionSeverity;
  status: IntegrationExceptionStatus;
  message: string;
  channelAccountId?: string;
  context?: Record<string, unknown> | null;
  retryCount?: number;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

export interface IntegrationExceptionFilters {
  status?: IntegrationExceptionStatus | "ALL";
  severity?: IntegrationExceptionSeverity | "ALL";
}

export interface IntegrationHealth {
  webhookIngestionRate?: number;
  duplicateCount?: number;
  syncLagSeconds?: number;
  stockDrift?: number | null;
  exceptionAgingHours?: number;
  lastReconciliationAt?: string | null;
}

export interface ReconciliationRun {
  id: string;
  status: string;
}

