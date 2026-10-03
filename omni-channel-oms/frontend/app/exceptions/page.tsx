"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { CheckCircle2, Clock3, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  IntegrationException,
  IntegrationExceptionSeverity,
  IntegrationExceptionStatus,
  resolveIntegrationException,
  retryIntegrationException,
  useIntegrationExceptions,
} from "@/hooks/useIntegrationOperations";
import { getApiErrorMessage } from "@/lib/api-error";

const severityStyles: Record<IntegrationExceptionSeverity, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
};

const statusStyles: Record<IntegrationExceptionStatus, string> = {
  OPEN: "bg-red-50 text-red-700",
  RETRYING: "bg-blue-50 text-blue-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
};

const sensitiveKeyPattern = /token|password|secret|authorization|cookie|email|phone|address/i;

function formatDate(value: string): string {
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? "Unknown time"
    : formatDistanceToNowStrict(parsedDate, { addSuffix: true });
}

function redactValue(value: unknown, key = ""): unknown {
  if (sensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, nestedValue]) => [
        nestedKey,
        redactValue(nestedValue, nestedKey),
      ]),
    );
  }

  return value;
}

function redactContext(context: IntegrationException["context"]): string {
  if (!context || Object.keys(context).length === 0) {
    return "No diagnostic context was recorded.";
  }

  return JSON.stringify(redactValue(context), null, 2);
}

export default function ExceptionsPage() {
  const [statusFilter, setStatusFilter] = useState<IntegrationExceptionStatus | "ALL">("ALL");
  const [severityFilter, setSeverityFilter] = useState<IntegrationExceptionSeverity | "ALL">("ALL");
  const { exceptions, error, isLoading, mutate } = useIntegrationExceptions({
    status: statusFilter,
    severity: severityFilter,
  });
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const exceptionSummary = useMemo(
    () => ({
      openCritical: exceptions.filter(
        (exception) =>
          exception.status !== "RESOLVED" && exception.severity === "CRITICAL",
      ).length,
      retrying: exceptions.filter((exception) => exception.status === "RETRYING").length,
      oldestOpen: exceptions
        .filter((exception) => exception.status !== "RESOLVED")
        .map((exception) => new Date(exception.createdAt).getTime())
        .filter((time) => !Number.isNaN(time))
        .sort((first, second) => first - second)[0],
    }),
    [exceptions],
  );

  const handleAction = async (
    exceptionId: string,
    action: "retry" | "resolve",
  ): Promise<void> => {
    setPendingActionId(exceptionId);
    try {
      if (action === "retry") {
        await retryIntegrationException(exceptionId);
        toast.success("Retry queued for this exception");
      } else {
        await resolveIntegrationException(exceptionId);
        toast.success("Exception marked as resolved");
      }
      await mutate();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, `Unable to ${action} this exception.`));
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Operations</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-heading">Integration exceptions</h1>
          <p className="mt-2 max-w-2xl text-body">
            Investigate mapping, stock, webhook, and sync failures before they become manual work.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Open critical</p>
            <p className="mt-2 text-2xl font-bold text-red-700">{exceptionSummary.openCritical}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Retrying</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">{exceptionSummary.retrying}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Oldest open</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-heading">
              <Clock3 className="h-5 w-5 text-amber-600" />
              {exceptionSummary.oldestOpen
                ? formatDistanceToNowStrict(exceptionSummary.oldestOpen, { addSuffix: true })
                : "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center">
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-heading">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as IntegrationExceptionStatus | "ALL")}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
            >
              <option value="ALL">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="RETRYING">Retrying</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-heading">
            Severity
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as IntegrationExceptionSeverity | "ALL")}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
            >
              <option value="ALL">All severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </label>
        </div>

        <section aria-label="Integration exceptions" className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
          {isLoading ? (
            <div className="p-6"><TableSkeleton /></div>
          ) : error ? (
            <ErrorState
              title="Could not load integration exceptions"
              message="Check your network connection and try again."
              onRetry={() => void mutate()}
            />
          ) : exceptions.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-12 w-12 text-emerald-500" />}
              title="No matching exceptions"
              description="The integration queue is clear for the selected filters."
            />
          ) : (
            <div className="divide-y divide-border">
              {exceptions.map((exception) => (
                <article key={exception.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-heading">{exception.type}</h2>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${severityStyles[exception.severity]}`}>
                            {exception.severity.toLowerCase()}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[exception.status]}`}>
                            {exception.status.toLowerCase()}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-body">{exception.message}</p>
                        <p className="mt-2 text-xs text-body">
                          {formatDate(exception.createdAt)}
                          {exception.channelAccountId ? ` · Connection ${exception.channelAccountId}` : ""}
                          {exception.retryCount === undefined ? "" : ` · ${exception.retryCount} retries`}
                        </p>
                        <details className="mt-3 max-w-3xl">
                          <summary className="cursor-pointer text-sm font-medium text-primary">View redacted diagnostic context</summary>
                          <pre className="mt-2 overflow-x-auto rounded-lg bg-secondary-50 p-3 text-xs leading-5 text-body">
                            {redactContext(exception.context)}
                          </pre>
                        </details>
                      </div>
                    </div>
                    {exception.status !== "RESOLVED" && (
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          isLoading={pendingActionId === exception.id}
                          onClick={() => void handleAction(exception.id, "retry")}
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Retry
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pendingActionId === exception.id}
                          onClick={() => void handleAction(exception.id, "resolve")}
                        >
                          <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
