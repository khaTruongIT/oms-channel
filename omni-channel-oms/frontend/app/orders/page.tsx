/**
 * Orders Page - Enhanced with Phase 1 & Sprint 2 Components
 * Integrated: Server-side Pagination, URL sync, EmptyState, Skeleton, ExportButton,
 * Bulk Status Transitions with Idempotency & Partial Error handling, Bulk Packing Slip Printing
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Table, { Column } from "@/components/ui/Table";
import { OrderStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CreateOrderModal from "@/components/orders/CreateOrderModal";
import CancelOrderModal from "@/components/orders/CancelOrderModal";
import {
  Order,
  bulkUpdateOrderStatus,
} from "@/hooks/useOrders";
import {
  Plus,
  Eye,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import ExportButton from "@/components/ui/ExportButton";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import BulkActionBar from "@/components/ui/BulkActionBar";
import { toast } from "sonner";
import { useChannelAccounts } from "@/hooks/useChannelAccounts";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { getApiErrorMessage } from "@/lib/api-error";
import type { OrderStatus } from "@/types/orders";

interface OrdersFiltersState {
  status: OrderStatus | "ALL";
  channel: string;
  externalOrderId: string;
  channelAccountId: string;
  q: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { accounts } = useChannelAccounts();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkCancelModalOpen, setIsBulkCancelModalOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Server-side pagination & filter sync
  const {
    items: orders,
    total,
    totalPages,
    page,
    limit,
    filters,
    setPage,
    setFilters,
    resetFilters,
    isLoading,
    mutate,
  } = usePaginatedQuery<Order, OrdersFiltersState>({
    endpoint: "/orders",
    defaultPage: 1,
    defaultLimit: 10,
    defaultFilters: {
      status: "ALL",
      channel: "",
      externalOrderId: "",
      channelAccountId: "",
      q: "",
    },
    syncWithUrl: true,
  });

  // Bulk selection on current page items
  const {
    selectedIds,
    selectedCount,
    isSelected,
    isAllSelected,
    toggleItem,
    toggleAll,
    clearSelection,
  } = useBulkSelection(orders);

  const handleRowClick = (order: Order): void => {
    router.push(`/orders/${order.id}`);
  };

  // Bulk Status Transition Handler with Partial Failures & Idempotency
  const handleBulkStatusChange = async (targetStatus: OrderStatus, reason?: string) => {
    if (selectedIds.length === 0) return;

    setIsBulkProcessing(true);
    const idempotencyKey = `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const res = await bulkUpdateOrderStatus({
        orderIds: selectedIds,
        status: targetStatus,
        reason,
        idempotencyKey,
      });

      if (res.failureCount === 0) {
        toast.success(
          `Successfully updated ${res.successCount} order${res.successCount > 1 ? "s" : ""} to ${targetStatus}`,
        );
      } else if (res.successCount > 0) {
        const errorSummary = res.failed
          .slice(0, 3)
          .map((f) => `${f.id.slice(0, 8)}: ${f.message}`)
          .join("; ");
        toast.warning(
          `Updated ${res.successCount} orders. ${res.failureCount} failed: ${errorSummary}`,
        );
      } else {
        const errorSummary = res.failed
          .slice(0, 3)
          .map((f) => f.message)
          .join("; ");
        toast.error(
          `Failed to update orders: ${errorSummary || "Invalid status transition"}`,
        );
      }

      clearSelection();
      await mutate();
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error, "Bulk status update failed");
      toast.error(`State conflict: ${msg}. Refreshing latest order statuses.`);
      await mutate();
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Bulk Packing Slip Print (Max 50 Orders)
  const handleBulkPrint = (): void => {
    if (selectedIds.length === 0) return;

    if (selectedIds.length > 50) {
      toast.error(
        `Cannot print more than 50 packing slips at once. You selected ${selectedIds.length}. Please reduce your selection.`,
      );
      return;
    }

    router.push(`/orders/bulk-print?ids=${selectedIds.join(",")}`);
  };

  const columns: Column<Order>[] = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={toggleAll}
          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
        />
      ),
      render: (_value: unknown, order: Order) => (
        <input
          type="checkbox"
          checked={isSelected(order.id)}
          onChange={() => toggleItem(order.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
        />
      ),
    },
    {
      key: "orderNumber",
      label: "Order #",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-primary">{String(value)}</span>
      ),
    },
    {
      key: "channel",
      label: "Channel",
      render: (value: unknown) => (
        <span className="capitalize text-heading">{String(value)}</span>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      render: (value: unknown) => (
        <span className="text-heading">{String(value ?? "Unknown customer")}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => <OrderStatusBadge status={String(value)} />,
    },
    {
      key: "items",
      label: "Items",
      render: (_value: unknown, order: Order) => (
        <span className="text-body">{order.items?.length || 0} items</span>
      ),
    },
    {
      key: "externalOrderId",
      label: "External ID",
      render: (value: unknown) => (
        <code className="rounded bg-secondary-100 px-2 py-1 text-xs">
          {String(value)}
        </code>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value: unknown) => (
        <span className="text-body">
          {format(new Date(String(value)), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_value: unknown, order: Order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/orders/${order.id}`);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/orders/${order.id}/print?type=packing-slip`);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Print packing slip"
          >
            <Printer className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      ),
    },
  ];

  // Prepare export data
  const exportData = orders.map((order) => ({
    "Order Number": order.orderNumber,
    Channel: order.channel,
    Customer: order.customerName ?? "",
    Status: order.status,
    Items: order.items?.length || 0,
    "External ID": order.externalOrderId,
    Created: format(new Date(order.createdAt), "yyyy-MM-dd"),
  }));

  const hasActiveFilters = Boolean(
    (filters.status && filters.status !== "ALL") ||
      filters.channel ||
      filters.externalOrderId ||
      filters.channelAccountId ||
      filters.q,
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-heading">Orders</h1>
            <p className="text-body mt-1">
              Manage and track all multi-channel orders ({total} total)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton
              data={exportData}
              filename="orders"
              variant="secondary"
            />
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Filter Bar with URL synchronization */}
        <div className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-2 md:grid-cols-5">
          <label className="flex flex-col gap-1 text-sm font-medium text-heading sm:col-span-2 md:col-span-1">
            Search
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-placeholder" />
              <input
                value={filters.q ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, q: event.target.value }))
                }
                placeholder="Order #, customer, ID..."
                className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-heading">
            Channel
            <select
              value={filters.channel ?? ""}
              onChange={(event) =>
                setFilters((current) => ({ ...current, channel: event.target.value }))
              }
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
            >
              <option value="">All channels</option>
              <option value="shopee">Shopee</option>
              <option value="tiktok">TikTok Shop</option>
              <option value="lazada">Lazada</option>
              <option value="manual">Manual</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-heading">
            Status
            <select
              value={filters.status ?? "ALL"}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as OrderStatus | "ALL",
                }))
              }
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-heading">
            Account
            <select
              value={filters.channelAccountId ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  channelAccountId: event.target.value,
                }))
              }
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
            >
              <option value="">All accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.shopName ?? account.shopId ?? account.id}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-heading flex-1">
              External ID
              <input
                value={filters.externalOrderId ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    externalOrderId: event.target.value,
                  }))
                }
                placeholder="External order ID"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
              />
            </label>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                onClick={resetFilters}
                className="mb-0.5 px-3"
                title="Reset all filters"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={10} />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<Plus className="w-12 h-12" />}
              title={hasActiveFilters ? "No matching orders" : "No orders yet"}
              description={
                hasActiveFilters
                  ? "Try adjusting your filter criteria to find what you're looking for."
                  : "Get started by creating your first multi-channel order"
              }
              action={
                hasActiveFilters ? (
                  <Button variant="secondary" onClick={resetFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Order
                  </Button>
                )
              }
            />
          ) : (
            <>
              <Table
                columns={columns}
                data={orders}
                onRowClick={handleRowClick}
                getRowId={(order) => order.id}
              />
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={limit}
                totalItems={total}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Bulk Action Bar with Status Transitions & Printing */}
      <BulkActionBar
        selectedCount={selectedCount}
        onClear={clearSelection}
        isLoading={isBulkProcessing}
        actions={[
          {
            label: "Confirm",
            icon: <CheckCircle2 className="w-4 h-4 mr-1.5" />,
            onClick: () => void handleBulkStatusChange("CONFIRMED"),
            variant: "primary",
          },
          {
            label: "Process",
            icon: <Clock className="w-4 h-4 mr-1.5" />,
            onClick: () => void handleBulkStatusChange("PROCESSING"),
            variant: "secondary",
          },
          {
            label: "Ship",
            icon: <Truck className="w-4 h-4 mr-1.5" />,
            onClick: () => void handleBulkStatusChange("SHIPPED"),
            variant: "secondary",
          },
          {
            label: "Cancel",
            icon: <XCircle className="w-4 h-4 mr-1.5" />,
            onClick: () => setIsBulkCancelModalOpen(true),
            variant: "danger",
          },
          {
            label: "Print Slips",
            icon: <Printer className="w-4 h-4 mr-1.5" />,
            onClick: handleBulkPrint,
            variant: "secondary",
          },
        ]}
      />

      {/* Bulk Cancel Modal */}
      <CancelOrderModal
        isOpen={isBulkCancelModalOpen}
        onClose={() => setIsBulkCancelModalOpen(false)}
        onConfirm={(reason) => handleBulkStatusChange("CANCELLED", reason)}
        orderNumber={`${selectedCount} selected orders`}
        isSubmitting={isBulkProcessing}
      />

      {/* Create Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          mutate();
        }}
      />
    </DashboardLayout>
  );
}
