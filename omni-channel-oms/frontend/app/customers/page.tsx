/**
 * Customers List Page - Sprint 4.3 (E4B, D1-D2)
 * Customer management with server-side search, sorting, and pagination
 * Derived automatically from omni-channel marketplace orders.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Table, { Column } from "@/components/ui/Table";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { Eye, Mail, Phone, Users, Search, ArrowUpDown, Info } from "lucide-react";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import ExportButton from "@/components/ui/ExportButton";
import FeatureGate from "@/components/layout/FeatureGate";

export default function CustomersPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "total_spent" | "total_orders" | "created_at" | "last_order_at"
  >("total_spent");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const pageSize = 10;

  const { customers, total, totalPages, isLoading } = useCustomers({
    page: currentPage,
    limit: pageSize,
    q: searchQuery,
    sortBy,
    sortOrder,
  });

  const columns: Column<Customer>[] = [
    {
      key: "fullName",
      label: "Khách hàng",
      sortable: true,
      render: (_: any, customer: Customer) => (
        <div>
          <div className="font-semibold text-gray-900">
            {customer.fullName || customer.name || "Khách hàng"}
          </div>
          {customer.email ? (
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-gray-400" />
              {customer.email}
            </div>
          ) : (
            <div className="text-xs text-gray-400 mt-0.5">Chưa có email</div>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Số điện thoại",
      render: (value?: string) =>
        value ? (
          <div className="flex items-center gap-1.5 text-gray-700 font-mono text-sm">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            {value}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
    {
      key: "totalOrders",
      label: "Tổng đơn hàng",
      sortable: true,
      render: (value: number) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {value || 0} đơn
        </span>
      ),
    },
    {
      key: "totalSpent",
      label: "Tổng chi tiêu",
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-gray-900">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(value || 0)}
        </span>
      ),
    },
    {
      key: "lastOrderAt",
      label: "Đơn gần nhất",
      render: (value?: string | null, customer?: Customer) => {
        const dateStr = value || customer?.createdAt;
        return (
          <span className="text-sm text-gray-600">
            {dateStr ? format(new Date(dateStr), "dd/MM/yyyy HH:mm") : "-"}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (_: any, customer: Customer) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/customers/${customer.id}`);
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-blue-600 transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Export data
  const exportData = customers.map((customer) => ({
    "Họ tên": customer.fullName || customer.name || "Khách hàng",
    "Số điện thoại": customer.phone || "",
    Email: customer.email || "",
    "Tổng đơn hàng": customer.totalOrders,
    "Tổng chi tiêu": customer.totalSpent,
    "Đơn gần nhất": customer.lastOrderAt
      ? format(new Date(customer.lastOrderAt), "yyyy-MM-dd HH:mm:ss")
      : "",
    "Ngày tạo": customer.createdAt
      ? format(new Date(customer.createdAt), "yyyy-MM-dd HH:mm:ss")
      : "",
  }));

  return (
    <DashboardLayout>
      <FeatureGate feature="customers">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
              <p className="text-sm text-gray-500 mt-1">
                Quản lý và tổng hợp hồ sơ khách hàng tự động từ đơn bán hàng đa kênh
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton
                data={exportData}
                filename="danh-sach-khach-hang"
                variant="secondary"
              />
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="text-sm text-sky-800">
              <span className="font-semibold">Hệ thống khách hàng tự động:</span> Danh sách khách
              hàng được tổng hợp và cập nhật liên tục từ các đơn hàng Shopee, TikTok Shop, Lazada và
              kênh nội bộ theo chuẩn định danh số điện thoại và buyer ID.
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="bg-white rounded-xl shadow-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, số điện thoại..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <span>Sắp xếp:</span>
                <select
                  value={`${sortBy}:${sortOrder}`}
                  onChange={(e) => {
                    const [f, o] = e.target.value.split(":");
                    setSortBy(f as any);
                    setSortOrder(o as any);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="total_spent:DESC">Chi tiêu cao nhất</option>
                  <option value="total_orders:DESC">Nhiều đơn nhất</option>
                  <option value="last_order_at:DESC">Đơn gần nhất</option>
                  <option value="created_at:DESC">Mới nhất</option>
                  <option value="created_at:ASC">Cũ nhất</option>
                </select>
              </div>
              <span className="text-sm text-gray-500">
                Tổng: <span className="font-semibold text-gray-800">{total}</span>
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {isLoading ? (
              <div className="p-6">
                <TableSkeleton rows={8} />
              </div>
            ) : customers.length === 0 ? (
              <EmptyState
                icon={<Users className="w-12 h-12 text-gray-400" />}
                title={searchQuery ? "Không tìm thấy khách hàng phù hợp" : "Chưa có khách hàng nào"}
                description={
                  searchQuery
                    ? "Vui lòng thử tìm kiếm với từ khóa hoặc số điện thoại khác."
                    : "Hồ sơ khách hàng sẽ tự động xuất hiện khi có đơn hàng được đồng bộ vào hệ thống."
                }
              />
            ) : (
              <>
                <Table<Customer>
                  columns={columns}
                  data={customers}
                  onRowClick={(customer) =>
                    router.push(`/customers/${customer.id}`)
                  }
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={total}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
