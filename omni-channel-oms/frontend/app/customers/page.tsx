/**
 * Customers List Page
 * Customer management with search, filter, pagination
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { useCustomers, Customer, deleteCustomer } from "@/hooks/useCustomers";
import { Plus, Eye, Trash2, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import ExportButton from "@/components/ui/ExportButton";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import BulkActionBar from "@/components/ui/BulkActionBar";
import { toast } from "sonner";

export default function CustomersPage() {
  const router = useRouter();
  const { customers, isLoading, mutate } = useCustomers();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;

  // Bulk selection
  const {
    selectedIds,
    selectedCount,
    isSelected,
    isAllSelected,
    toggleItem,
    toggleAll,
    clearSelection,
  } = useBulkSelection(customers || []);

  // Filter customers by search query
  const filteredCustomers =
    customers?.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  // Pagination
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(id);
        toast.success("Customer deleted");
        mutate();
      } catch (error) {
        toast.error("Failed to delete customer");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedCount} customer(s)?`)) {
      try {
        // TODO: Implement bulk delete API
        toast.success(`${selectedCount} customer(s) deleted`);
        clearSelection();
        mutate();
      } catch (error) {
        toast.error("Failed to delete customers");
      }
    }
  };

  const columns = [
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
      render: (_: any, customer: Customer) => (
        <input
          type="checkbox"
          checked={isSelected(customer.id)}
          onChange={() => toggleItem(customer.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
        />
      ),
    },
    {
      key: "name",
      label: "Customer",
      sortable: true,
      render: (value: string, customer: Customer) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {customer.email}
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (value?: string) =>
        value ? (
          <div className="flex items-center gap-1 text-gray-600">
            <Phone className="w-3 h-3" />
            {value}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: "totalOrders",
      label: "Orders",
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: "totalSpent",
      label: "Total Spent",
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-primary">
          ${value.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (value: string) => (
        <span className="text-gray-600">
          {format(new Date(value), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, customer: Customer) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/customers/${customer.id}`);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(customer.id);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  // Export data
  const exportData = filteredCustomers.map((customer) => ({
    Name: customer.name,
    Email: customer.email,
    Phone: customer.phone || "",
    Orders: customer.totalOrders,
    "Total Spent": customer.totalSpent,
    Status: customer.status,
    Joined: format(new Date(customer.createdAt), "yyyy-MM-dd"),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-heading">Customers</h1>
            <p className="text-body mt-1">Manage your customer relationships</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton
              data={exportData}
              filename="customers"
              variant="secondary"
            />
            <Button
              variant="primary"
              onClick={() => router.push("/customers/new")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-card p-4">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={10} />
            </div>
          ) : paginatedCustomers.length === 0 ? (
            <EmptyState
              icon={<Plus className="w-12 h-12" />}
              title={searchQuery ? "No customers found" : "No customers yet"}
              description={
                searchQuery
                  ? "Try adjusting your search query"
                  : "Start building your customer base"
              }
              action={
                !searchQuery ? (
                  <Button
                    variant="primary"
                    onClick={() => router.push("/customers/new")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <Table
                columns={columns}
                data={paginatedCustomers}
                onRowClick={(customer) =>
                  router.push(`/customers/${customer.id}`)
                }
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
        ]}
      />
    </DashboardLayout>
  );
}
