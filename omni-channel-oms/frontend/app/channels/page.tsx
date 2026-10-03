"use client";

import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import {
  Clipboard,
  Link2,
  Plus,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import MappingForm from "@/components/channels/MappingForm";
import Modal from "@/components/ui/Modal";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import {
  ChannelAccount,
  ChannelAccountStatus,
  createShopeeAccount,
  disconnectChannelAccount,
  reconnectChannelAccount,
  useChannelAccounts,
} from "@/hooks/useChannelAccounts";
import {
  CreateChannelMappingInput,
  createChannelMapping,
  useChannelMappings,
} from "@/hooks/useChannelMappings";
import {
  triggerReconciliationRun,
  useIntegrationHealth,
} from "@/hooks/useIntegrationOperations";
import { getApiErrorMessage } from "@/lib/api-error";
import { useProducts } from "@/hooks/useProducts";

const accountStatusStyles: Record<ChannelAccountStatus, string> = {
  PENDING_CONTRACT: "bg-amber-50 text-amber-700",
  CONNECTED: "bg-emerald-50 text-emerald-700",
  DISCONNECTED: "bg-slate-100 text-slate-700",
  ERROR: "bg-red-50 text-red-700",
};

function formatDate(value?: string | null): string {
  if (!value) return "Not available";

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? "Not available"
    : formatDistanceToNowStrict(parsedDate, { addSuffix: true });
}

function isTokenWarning(account: ChannelAccount): boolean {
  if (!account.tokenExpiresAt) return false;

  const expiry = new Date(account.tokenExpiresAt).getTime();
  return !Number.isNaN(expiry) && expiry <= Date.now() + 7 * 24 * 60 * 60 * 1000;
}

function AccountStatusBadge({ status }: { status: ChannelAccountStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${accountStatusStyles[status]}`}>
      {status.toLowerCase()}
    </span>
  );
}

function HealthMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-body">{label}</p>
      <p className="mt-2 text-xl font-bold text-heading">{value}</p>
    </div>
  );
}

export default function ChannelsPage() {
  const {
    accounts,
    error: accountsError,
    isLoading: isAccountsLoading,
    mutate: mutateAccounts,
  } = useChannelAccounts();
  const [mappingAccountFilter, setMappingAccountFilter] = useState("");
  const {
    mappings,
    isError: mappingsError,
    isLoading: isMappingsLoading,
    mutate: mutateMappings,
  } = useChannelMappings({
    channel: "shopee",
    channelAccountId: mappingAccountFilter || undefined,
  });
  const {
    health,
    error: healthError,
    isLoading: isHealthLoading,
    mutate: mutateHealth,
  } = useIntegrationHealth();
  const { products } = useProducts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [shopId, setShopId] = useState("");
  const [shopName, setShopName] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [reconnectingAccountId, setReconnectingAccountId] = useState<string | null>(null);
  const [disconnectingAccountId, setDisconnectingAccountId] = useState<string | null>(null);
  const [reconcilingAccountId, setReconcilingAccountId] = useState<string | null>(null);

  const productById = new Map(products.map((product) => [product.id, product]));
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const visibleMappings = mappings.filter(
    (mapping) =>
      !mappingAccountFilter || mapping.channelAccountId === mappingAccountFilter,
  );

  const handleCreateMapping = async (data: CreateChannelMappingInput): Promise<void> => {
    await createChannelMapping(data);
    await mutateMappings();
  };

  const handleReconnect = async (accountId: string): Promise<void> => {
    setReconnectingAccountId(accountId);
    try {
      await reconnectChannelAccount(accountId);
      toast.success("Reconnect request submitted");
      await Promise.all([mutateAccounts(), mutateHealth()]);
    } catch {
      toast.error("Unable to reconnect this channel. Please try again.");
    } finally {
      setReconnectingAccountId(null);
    }
  };

  const handleDisconnect = async (accountId: string): Promise<void> => {
    setDisconnectingAccountId(accountId);
    try {
      await disconnectChannelAccount(accountId);
      toast.success("Channel account disconnected");
      await Promise.all([mutateAccounts(), mutateHealth()]);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to disconnect this channel."));
    } finally {
      setDisconnectingAccountId(null);
    }
  };

  const handleReconciliation = async (accountId: string): Promise<void> => {
    setReconcilingAccountId(accountId);
    try {
      const run = await triggerReconciliationRun(accountId);
      toast.success(`Reconciliation recorded as ${run.status}`);
      await mutateHealth();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to trigger reconciliation."));
    } finally {
      setReconcilingAccountId(null);
    }
  };

  const handleCopyCallback = async (callbackId: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(callbackId);
      toast.success("Webhook callback ID copied");
    } catch {
      toast.error("Unable to copy callback ID");
    }
  };

  const handleCreateAccount = async (): Promise<void> => {
    const normalizedShopId = shopId.trim();
    if (!normalizedShopId) {
      toast.error("Shopee shop ID is required.");
      return;
    }

    setIsCreatingAccount(true);
    try {
      await createShopeeAccount({
        shopId: normalizedShopId,
        shopName: shopName.trim() || undefined,
      });
      toast.success("Shopee shop registered for the contract gate.");
      setShopId("");
      setShopName("");
      setIsAccountFormOpen(false);
      await mutateAccounts();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to register this Shopee shop."));
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Operations</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-heading">
              Connections &amp; SKU mappings
            </h1>
            <p className="mt-2 max-w-2xl text-body">
              Monitor the Shopee connection, token health, and product mappings that make stock sync safe.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setIsAccountFormOpen(true)}>
              <Link2 className="mr-2 h-4 w-4" />
              Register Shopee shop
            </Button>
            <Button variant="primary" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add SKU mapping
            </Button>
          </div>
        </header>

        <section aria-labelledby="connections-heading" className="space-y-4">
          <div>
            <h2 id="connections-heading" className="text-lg font-bold text-heading">Marketplace connections</h2>
            <p className="text-sm text-body">One active account is supported for the pilot warehouse.</p>
          </div>
          {isAccountsLoading ? (
            <CardSkeleton />
          ) : accountsError ? (
            <ErrorState
              title="Could not load marketplace connections"
              message="Check your network connection and try again."
              onRetry={() => void mutateAccounts()}
            />
          ) : accounts.length === 0 ? (
            <EmptyState
              icon={<Link2 className="h-12 w-12" />}
              title="No marketplace connection"
              description="Connect the approved Shopee shop before creating production mappings."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {accounts.map((account) => (
                <article key={account.id} className="rounded-xl border border-border bg-white p-5 shadow-card">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
                        <Link2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold capitalize text-heading">{account.provider}</h3>
                          <AccountStatusBadge status={account.status} />
                        </div>
                        <p className="mt-1 text-sm text-body">
                          {account.shopName ?? "Unnamed shop"}
                          {account.shopId ? ` · Shop ${account.shopId}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={reconcilingAccountId === account.id}
                        onClick={() => void handleReconciliation(account.id)}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Reconcile
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={reconnectingAccountId === account.id}
                        onClick={() => void handleReconnect(account.id)}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Reconnect
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={disconnectingAccountId === account.id}
                        onClick={() => void handleDisconnect(account.id)}
                      >
                        <Unplug className="mr-1.5 h-3.5 w-3.5" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm text-body">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Webhook callback issued
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${isTokenWarning(account) ? "text-amber-700" : "text-body"}`}>
                      {isTokenWarning(account) && <TriangleAlert className="h-4 w-4" />}
                      Token expires {formatDate(account.tokenExpiresAt)}
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-left text-sm text-body hover:text-primary"
                      onClick={() => void handleCopyCallback(account.webhookCallbackId)}
                    >
                      <Clipboard className="h-4 w-4" />
                      Callback ID: <code className="truncate">{account.webhookCallbackId}</code>
                    </button>
                  </div>
                  {account.status === "PENDING_CONTRACT" && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Contract gate is still active. This shop is registered, but production Shopee sync is not enabled yet.
                    </p>
                  )}
                  {account.lastError && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      {account.lastError}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="health-heading" className="space-y-4">
          <div>
            <h2 id="health-heading" className="text-lg font-bold text-heading">Integration health</h2>
            <p className="text-sm text-body">Live indicators from webhook processing and reconciliation.</p>
          </div>
          {isHealthLoading ? (
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => <CardSkeleton key={index} />)}
            </div>
          ) : healthError ? (
            <ErrorState
              title="Could not load integration health"
              message="Health data will refresh when the service is available."
              onRetry={() => void mutateHealth()}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <HealthMetric label="Accepted webhooks (24h)" value={health?.webhookIngestionRate?.toString() ?? "—"} />
              <HealthMetric label="Duplicates" value={health?.duplicateCount?.toString() ?? "—"} />
              <HealthMetric label="Sync lag" value={health?.syncLagSeconds === undefined ? "—" : `${health.syncLagSeconds}s`} />
              <HealthMetric label="Stock drift" value={health?.stockDrift?.toString() ?? "—"} />
              <HealthMetric label="Oldest exception" value={health?.exceptionAgingHours === undefined ? "—" : `${health.exceptionAgingHours}h`} />
              <HealthMetric label="Last reconciliation" value={formatDate(health?.lastReconciliationAt)} />
            </div>
          )}
        </section>

        <section aria-labelledby="mappings-heading" className="space-y-4">
          <div>
            <h2 id="mappings-heading" className="text-lg font-bold text-heading">SKU mappings</h2>
            <p className="text-sm text-body">Mappings prevent unrecognised marketplace SKUs from changing inventory.</p>
          </div>
          <div className="max-w-sm">
            <label className="flex flex-col gap-1 text-sm font-medium text-heading">
              Mapping account
              <select
                value={mappingAccountFilter}
                onChange={(event) => setMappingAccountFilter(event.target.value)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
              >
                <option value="">All Shopee accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.shopName ?? account.shopId ?? account.id}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
            {isMappingsLoading ? (
              <div className="p-6"><TableSkeleton /></div>
            ) : mappingsError ? (
              <ErrorState
                title="Could not load SKU mappings"
                message="Check your connection and try again."
                onRetry={() => void mutateMappings()}
              />
            ) : visibleMappings.length === 0 ? (
              <EmptyState
                icon={<Link2 className="h-12 w-12" />}
                title="No SKU mappings"
                description={
                  mappings.length === 0
                    ? "Add the approved pilot SKUs before enabling inventory sync."
                    : "No mappings match the selected account."
                }
                action={<Button variant="primary" onClick={() => setIsFormOpen(true)}>Add SKU mapping</Button>}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-border bg-secondary-50 text-xs uppercase tracking-wide text-body">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Product</th>
                      <th className="px-5 py-3 font-semibold">Account</th>
                      <th className="px-5 py-3 font-semibold">Channel</th>
                      <th className="px-5 py-3 font-semibold">External item</th>
                      <th className="px-5 py-3 font-semibold">Variant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleMappings.map((mapping) => {
                      const product = productById.get(mapping.masterSkuId);
                      const account = mapping.channelAccountId
                        ? accountById.get(mapping.channelAccountId)
                        : undefined;

                      return (
                        <tr key={mapping.id} className="text-sm text-heading">
                          <td className="px-5 py-4">
                            <p className="font-medium">
                              {mapping.product?.name ??
                                product?.productName ??
                                "Unknown product"}
                            </p>
                            <p className="mt-0.5 text-xs text-body">
                              {mapping.product?.sku ??
                                product?.skuCode ??
                                mapping.masterSkuId}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium">
                              {account?.shopName ?? account?.shopId ?? "Legacy mapping"}
                            </p>
                            <p className="mt-0.5 text-xs text-body">
                              {mapping.channelAccountId ?? "No account scope"}
                            </p>
                          </td>
                          <td className="px-5 py-4 capitalize">{mapping.channel}</td>
                          <td className="px-5 py-4"><code className="rounded bg-secondary-100 px-2 py-1 text-xs">{mapping.externalItemId}</code></td>
                          <td className="px-5 py-4 text-body">{mapping.externalVariantId ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
      <MappingForm
        accounts={accounts}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateMapping}
      />
      <Modal
        isOpen={isAccountFormOpen}
        onClose={() => setIsAccountFormOpen(false)}
        title="Register Shopee shop"
      >
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateAccount();
          }}
        >
          <p className="text-sm text-body">
            This only registers the pilot shop. Partner credentials and webhook signing remain disabled until the official Shopee contract is available.
          </p>
          <label className="block text-sm font-medium text-heading">
            Shopee shop ID
            <input
              required
              value={shopId}
              onChange={(event) => setShopId(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-heading">
            Shop display name <span className="font-normal text-body">(optional)</span>
            <input
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAccountFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreatingAccount}>
              Register shop
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
