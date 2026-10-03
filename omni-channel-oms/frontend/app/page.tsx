"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/dashboard/KPICard";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useChannelAccounts } from "@/hooks/useChannelAccounts";
import { useChannelMappings } from "@/hooks/useChannelMappings";
import {
  triggerReconciliationRun,
  useIntegrationExceptions,
  useIntegrationHealth,
} from "@/hooks/useIntegrationOperations";
import { AlertTriangle, CheckCircle2, Link2, RefreshCw, ShieldAlert } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error";

function formatDate(value?: string | null): string {
  if (!value) return "Never";
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? "Never"
    : formatDistanceToNowStrict(parsedDate, { addSuffix: true });
}

export default function DashboardPage() {
  const {
    accounts,
    error: accountsError,
    isLoading: accountsLoading,
    mutate: mutateAccounts,
  } = useChannelAccounts();
  const {
    mappings,
    isError: mappingsError,
    isLoading: mappingsLoading,
    mutate: mutateMappings,
  } = useChannelMappings({ channel: "shopee" });
  const {
    health,
    error: healthError,
    isLoading: healthLoading,
    mutate: mutateHealth,
  } = useIntegrationHealth();
  const {
    exceptions,
    error: exceptionsError,
    isLoading: exceptionsLoading,
    mutate: mutateExceptions,
  } = useIntegrationExceptions({ status: "OPEN" });
  const [isReconciling, setIsReconciling] = useState(false);

  const shopeeAccounts = useMemo(
    () => accounts.filter((account) => account.provider === "shopee"),
    [accounts],
  );
  const connectedAccounts = shopeeAccounts.filter(
    (account) => account.status === "CONNECTED",
  );
  const criticalExceptions = exceptions.filter(
    (exception) => exception.severity === "CRITICAL",
  );

  const isLoading =
    accountsLoading || mappingsLoading || healthLoading || exceptionsLoading;
  const hasError = accountsError || mappingsError || healthError || exceptionsError;

  const handleRetryLoad = (): void => {
    void Promise.all([
      mutateAccounts(),
      mutateMappings(),
      mutateHealth(),
      mutateExceptions(),
    ]);
  };

  const handleReconcile = async (): Promise<void> => {
    const accountId = shopeeAccounts[0]?.id;
    if (!accountId) {
      toast.error("Register a Shopee account before running reconciliation.");
      return;
    }

    setIsReconciling(true);
    try {
      const run = await triggerReconciliationRun(accountId);
      toast.success(`Reconciliation recorded as ${run.status}`);
      await mutateHealth();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to trigger reconciliation."));
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Shopee pilot
            </p>
            <h1 className="mt-1 text-2xl font-bold text-heading">
              Operations readiness
            </h1>
            <p className="mt-1 max-w-2xl text-body">
              Real operational signals for the one-tenant, one-warehouse pilot.
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={shopeeAccounts.length === 0}
            isLoading={isReconciling}
            onClick={() => void handleReconcile()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Run reconciliation
          </Button>
        </div>

        {hasError && (
          <ErrorState
            title="Could not load pilot readiness"
            message="Refresh the operational data before making cutover decisions."
            onRetry={handleRetryLoad}
          />
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Shopee accounts"
              value={`${connectedAccounts.length}/${shopeeAccounts.length}`}
              icon={<Link2 className="h-6 w-6" />}
              iconColor={connectedAccounts.length > 0 ? "success" : "warning"}
            />
            <KPICard
              title="Mapped SKUs"
              value={mappings.length.toLocaleString()}
              icon={<CheckCircle2 className="h-6 w-6" />}
              iconColor={mappings.length > 0 ? "success" : "warning"}
            />
            <KPICard
              title="Open critical"
              value={criticalExceptions.length.toLocaleString()}
              icon={<ShieldAlert className="h-6 w-6" />}
              iconColor={criticalExceptions.length > 0 ? "warning" : "success"}
            />
            <KPICard
              title="Accepted webhooks"
              value={(health?.webhookIngestionRate ?? 0).toLocaleString()}
              icon={<AlertTriangle className="h-6 w-6" />}
              iconColor="info"
            />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-xl border border-border bg-white p-5 shadow-card lg:col-span-2">
            <h2 className="text-lg font-semibold text-heading">Readiness checklist</h2>
            <div className="mt-4 divide-y divide-border">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-body">Shopee shop registered</span>
                <span className="font-semibold text-heading">
                  {shopeeAccounts.length > 0 ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-body">Contract gate cleared</span>
                <span className="font-semibold text-heading">
                  {connectedAccounts.length > 0 ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-body">SKU mappings available</span>
                <span className="font-semibold text-heading">
                  {mappings.length > 0 ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-body">Last reconciliation</span>
                <span className="font-semibold text-heading">
                  {formatDate(health?.lastReconciliationAt)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white p-5 shadow-card">
            <h2 className="text-lg font-semibold text-heading">Pilot stance</h2>
            <p className="mt-3 text-sm leading-6 text-body">
              Accounts in `PENDING_CONTRACT` are expected until Shopee Partner API
              credentials, scopes, webhook signing, and rate limits are confirmed.
              This dashboard intentionally avoids mock revenue and marketplace
              charts so UAT decisions are made from real operational signals.
            </p>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
