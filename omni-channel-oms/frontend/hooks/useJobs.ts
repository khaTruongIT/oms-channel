import api from "@/lib/api";
import { useTenantScopedSWR } from "@/hooks/useTenantScopedSWR";

export interface JobStatus {
  id: string;
  name: string;
  queue: string;
  state: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  data?: Record<string, unknown>;
  result?: Record<string, unknown>;
  failedReason?: string;
  processedOn?: string;
  finishedOn?: string;
}

export interface SyncResult {
  message: string;
  jobId?: string;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useJobStatus(queueName: string, jobId: string) {
  const { data, error, isLoading, mutate } = useTenantScopedSWR<JobStatus>(
    queueName && jobId ? `/jobs/status/${queueName}/${jobId}` : null,
    fetcher,
    { refreshInterval: 2000 }, // Poll every 2 seconds for active jobs
  );

  return {
    job: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function triggerBatchSync(): Promise<SyncResult> {
  const response = await api.post("/jobs/sync/trigger");
  return response.data;
}
