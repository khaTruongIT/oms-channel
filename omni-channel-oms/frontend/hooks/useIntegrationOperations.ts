"use client";

import api from "@/lib/api";
import { useTenantScopedSWR } from "@/hooks/useTenantScopedSWR";
import type {
  IntegrationException,
  IntegrationExceptionFilters,
  IntegrationHealth,
  ReconciliationRun,
} from "@/types/integration";

export type {
  IntegrationException,
  IntegrationExceptionFilters,
  IntegrationExceptionSeverity,
  IntegrationExceptionStatus,
  IntegrationHealth,
  ReconciliationRun,
} from "@/types/integration";

const fetcher = <T>(url: string): Promise<T> =>
  api.get<T>(url).then((response) => response.data);

function buildExceptionQuery(filters?: IntegrationExceptionFilters): string {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }
  if (filters?.severity && filters.severity !== "ALL") {
    params.set("severity", filters.severity);
  }

  const query = params.toString();
  return query ? `/integration-exceptions?${query}` : "/integration-exceptions";
}

export function useIntegrationExceptions(filters?: IntegrationExceptionFilters) {
  const { data, error, isLoading, mutate } = useTenantScopedSWR<IntegrationException[]>(
    buildExceptionQuery(filters),
    fetcher,
  );

  return { exceptions: data ?? [], error, isLoading, mutate };
}

export function useIntegrationHealth() {
  const { data, error, isLoading, mutate } = useTenantScopedSWR<IntegrationHealth>(
    "/integration-health",
    fetcher,
  );

  return { health: data, error, isLoading, mutate };
}

export async function retryIntegrationException(id: string): Promise<void> {
  await api.post(`/integration-exceptions/${id}/retry`);
}

export async function resolveIntegrationException(id: string): Promise<void> {
  await api.post(`/integration-exceptions/${id}/resolve`);
}

export async function triggerReconciliationRun(
  channelAccountId?: string,
): Promise<ReconciliationRun> {
  const query = channelAccountId
    ? `?channelAccountId=${encodeURIComponent(channelAccountId)}`
    : "";
  const response = await api.post<ReconciliationRun>(`/reconciliation-runs${query}`);
  return response.data;
}
