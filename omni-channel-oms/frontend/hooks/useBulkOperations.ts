/**
 * useBulkOperations Hook
 * Client integration for Omni-Channel OMS Bulk Jobs API
 */

"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";

export type BulkJobType =
  | "PRODUCT_IMPORT"
  | "INVENTORY_IMPORT"
  | "PRODUCT_DELETE"
  | "EXPORT";

export type BulkJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface BulkJobError {
  row: number;
  sku?: string;
  field?: string;
  message: string;
}

export interface BulkValidationSummary {
  total: number;
  validCount: number;
  invalidCount: number;
}

export interface BulkValidationResult {
  valid: boolean;
  summary: BulkValidationSummary;
  errors: BulkJobError[];
  dryRun?: boolean;
}

export interface BulkJobDetails {
  id: string;
  type: BulkJobType;
  status: BulkJobStatus;
  total: number;
  processed: number;
  failed: number;
  errorCount?: number;
  error_report?: BulkJobError[];
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export async function dryRunBulkJob(
  type: BulkJobType,
  rows: Record<string, any>[],
): Promise<BulkValidationResult> {
  const { data } = await api.post<BulkValidationResult>("/bulk-jobs", {
    type,
    rows,
    dryRun: true,
  });
  return data;
}

export async function startBulkJob(
  type: BulkJobType,
  rows: Record<string, any>[],
  idempotencyKey?: string,
): Promise<BulkJobDetails> {
  const { data } = await api.post<BulkJobDetails>("/bulk-jobs", {
    type,
    rows,
    idempotencyKey,
  });
  return data;
}

export async function getBulkJobStatus(jobId: string): Promise<BulkJobDetails> {
  const { data } = await api.get<BulkJobDetails>(`/bulk-jobs/${jobId}`);
  return data;
}

export async function triggerDownloadErrorsCsv(jobId: string): Promise<void> {
  const response = await api.get(`/bulk-jobs/${jobId}/errors.csv`, {
    responseType: "blob",
  });
  const blob = new Blob([response.data], { type: "text/csv; charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `bulk-job-${jobId}-errors.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function bulkDeleteProducts(skus: string[]): Promise<BulkJobDetails> {
  const rows = skus.map((sku) => ({ sku }));
  const { data } = await api.post<BulkJobDetails>("/bulk-jobs", {
    type: "PRODUCT_DELETE",
    rows,
  });
  return data;
}

export function useBulkOperations() {
  const [activeJob, setActiveJob] = useState<BulkJobDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dryRun = useCallback(
    async (type: BulkJobType, rows: Record<string, any>[]) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await dryRunBulkJob(type, rows);
        return result;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || "Lỗi kiểm tra dữ liệu trước khi nhập";
        setError(msg);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const runJob = useCallback(
    async (type: BulkJobType, rows: Record<string, any>[], idempotencyKey?: string) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const initialJob = await startBulkJob(type, rows, idempotencyKey);
        setActiveJob(initialJob);
        return initialJob;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || "Lỗi khởi tạo tiến trình xử lý hàng loạt";
        setError(msg);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return {
    activeJob,
    setActiveJob,
    isSubmitting,
    error,
    dryRun,
    runJob,
    downloadErrors: triggerDownloadErrorsCsv,
    bulkDeleteProducts,
  };
}
