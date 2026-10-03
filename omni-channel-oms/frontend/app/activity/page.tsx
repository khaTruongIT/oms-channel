"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import Table from "@/components/ui/Table";
import { Column } from "@/components/ui/Table";

export default function ActivityPage() {
  const [filters, setFilters] = useState({
    entityType: "",
    action: "",
  });

  const { logs, isLoading } = useAuditLogs(filters);

  const columns: Column[] = [
    {
      key: "createdAt",
      label: "Timestamp",
      sortable: true,
      render: (value: string) => {
        try {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return <span className="text-body text-sm">Invalid date</span>;
          }
          return (
            <span className="text-body text-sm">
              {format(date, "MMM dd, yyyy h:mm a")}
            </span>
          );
        } catch (error) {
          return <span className="text-body text-sm">-</span>;
        }
      },
    },
    {
      key: "entityType",
      label: "Entity",
      sortable: true,
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary uppercase">
          {value}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      sortable: true,
      render: (value: string) => (
        <span className="text-heading font-medium text-sm">{value}</span>
      ),
    },
    {
      key: "userId",
      label: "User",
      render: (value: string) => (
        <span className="text-body text-sm">{value || "System"}</span>
      ),
    },
    {
      key: "changes",
      label: "Changes",
      render: (value: any) => (
        <span className="text-body text-sm truncate max-w-xs block">
          {value ? JSON.stringify(value) : "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-heading">Activity Log</h1>
        <p className="text-body mt-1">Track all changes and actions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-heading mb-1">
              Filters:
            </label>
            <div className="flex space-x-3">
              <select
                className="form-select rounded-lg border-border"
                value={filters.entityType}
                onChange={(e) =>
                  setFilters({ ...filters, entityType: e.target.value })
                }
              >
                <option value="">All Entities</option>
                <option value="product">Product</option>
                <option value="inventory">Inventory</option>
                <option value="order">Order</option>
                <option value="tenant">Tenant</option>
              </select>

              <select
                className="form-select rounded-lg border-border"
                value={filters.action}
                onChange={(e) =>
                  setFilters({ ...filters, action: e.target.value })
                }
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="STATUS_CHANGE">Status Change</option>
                <option value="BATCH_STOCK_SYNC">Batch Stock Sync</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table
          columns={columns}
          data={logs || []}
          isLoading={isLoading}
          emptyMessage="No activity found"
        />
      </div>
    </div>
  );
}
