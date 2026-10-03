import useSWR from "swr";
import api from "@/lib/api";

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  limit?: number;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useAuditLogs(filters?: AuditLogFilters) {
  const params = new URLSearchParams();
  if (filters?.entityType) params.append("entityType", filters.entityType);
  if (filters?.entityId) params.append("entityId", filters.entityId);
  if (filters?.userId) params.append("userId", filters.userId);
  if (filters?.action) params.append("action", filters.action);
  if (filters?.limit) params.append("limit", filters.limit.toString());

  const queryString = params.toString();
  const url = `/audit${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<AuditLog[]>(url, fetcher);

  return {
    logs: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useEntityHistory(entityType: string, entityId: string) {
  const { data, error, isLoading } = useSWR<AuditLog[]>(
    entityType && entityId ? `/audit/entity/${entityType}/${entityId}` : null,
    fetcher,
  );

  return {
    history: data || [],
    isLoading,
    isError: error,
  };
}
