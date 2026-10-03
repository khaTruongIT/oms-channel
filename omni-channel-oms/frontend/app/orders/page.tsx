/**
 * Orders Page - Enhanced with Phase 1 Components
 * Integrated: Pagination, EmptyState, Skeleton, ExportButton, BulkActions
 */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Table, { Column } from "@/components/ui/Table";
import { OrderStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CreateOrderModal from "@/components/orders/CreateOrderModal";
import { useOrders, Order } from "@/hooks/useOrders";
import { Plus, Eye, Trash2, Printer } from "lucide-react";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import ExportButton from "@/components/ui/ExportButton";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import BulkActionBar from "@/components/ui/BulkActionBar";
import { toast } from "sonner";
import { useChannelAccounts } from "@/hooks/useChannelAccounts";
import type { OrderFilters, OrderStatus } from "@/types/orders";

export default function OrdersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<OrderFilters>({
    status: "ALL",
    channel: "",
    externalOrderId: "",
    channelAccountId: "",
  });
  const { orders, isLoading, mutate } = useOrders(filters);
  const { accounts } = useChannelAccounts();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesStatus =
          !filters.status || filters.status === "ALL" || order.status === filters.status;
        const matchesExternalId =
          !filters.externalOrderId ||
          order.externalOrderId
            .toLowerCase()
            .includes(filters.externalOrderId.toLowerCase());
        const matchesAccount =
          !filters.channelAccountId || order.channelAccountId === filters.channelAccountId;

        return matchesStatus && matchesExternalId && matchesAccount;
      }),
    [filters.channelAccountId, filters.externalOrderId, filters.status, orders],
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Bulk selection
  const {
    selectedCount,
    isSelected,
    isAllSelected,
    toggleItem,
    toggleAll,
    clearSelection,
  } = useBulkSelection(filteredOrders);

  const handleRowClick = (order: Order): void => {
    router.push(`/orders/${order.id}`);
  };

  const handleBulkDelete = async (): Promise<void> => {
    toast.info("Bulk delete is disabled until the order delete API is available.");
  };

  const handleBulkPrint = (): void => {
    // TODO: Implement bulk print
    toast.info("Bulk print feature coming soon");
  };

  // Pagination logic
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

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
              router.push(`/orders/${order.id}/print?type=invoice`);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Print invoice"
          >
            <Printer className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      ),
    },
  ];

  // Prepare export data
  const exportData =
    filteredOrders.map((order) => ({
      "Order Number": order.orderNumber,
      Channel: order.channel,
      Customer: order.customerName ?? "",
      Status: order.status,
      Items: order.items?.length || 0,
      "External ID": order.externalOrderId,
      Created: format(new Date(order.createdAt), "yyyy-MM-dd"),
    }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-heading">Orders</h1>
            <p className="text-body mt-1">Manage and track all your orders</p>
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

        <div className="grid gap-3 rounded-xl border border-border bg-white p-4 md:grid-cols-4">
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
          <label className="flex flex-col gap-1 text-sm font-medium text-heading">
            External ID
            <input
              value={filters.externalOrderId ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  externalOrderId: event.target.value,
                }))
              }
              placeholder="Search channel order"
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
            />
          </label>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={10} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon={<Plus className="w-12 h-12" />}
              title="No orders yet"
              description="Get started by creating your first order"
              action={
                <Button
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Order
                </Button>
              }
            />
          ) : (
            <>
              <Table
                columns={columns}
                data={paginatedOrders}
                onRowClick={handleRowClick}
                getRowId={(order) => order.id}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        onClear={clearSelection}
        actions={[
          {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4 mr-2" />,
            onClick: handleBulkDelete,
            variant: "danger",
          },
          {
            label: "Print",
            icon: <Printer className="w-4 h-4 mr-2" />,
            onClick: handleBulkPrint,
            variant: "secondary",
          },
        ]}
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
