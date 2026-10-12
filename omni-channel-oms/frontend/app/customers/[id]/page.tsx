/**
 * Customer Details Page - Sprint 4.3 (E4B, D1-D2)
 * Comprehensive customer view with order history and stats derived from orders
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCustomer } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";
import { CardSkeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { OrderStatusBadge } from "@/components/ui/Badge";
import FeatureGate from "@/components/layout/FeatureGate";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { customer, isLoading } = useCustomer(customerId);
  const { orders, isLoading: isOrdersLoading } = useOrders({ customerId });

  if (isLoading) {
    return (
      <DashboardLayout>
        <FeatureGate feature="customers">
          <div className="space-y-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </FeatureGate>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <FeatureGate feature="customers">
          <div className="text-center py-16 bg-white rounded-xl shadow-card">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Không tìm thấy khách hàng
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Hồ sơ khách hàng có thể đã bị thay đổi hoặc không tồn tại.
            </p>
            <Button variant="secondary" onClick={() => router.push("/customers")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách khách hàng
            </Button>
          </div>
        </FeatureGate>
      </DashboardLayout>
    );
  }

  const customerOrders = orders && orders.length > 0 ? orders : (customer.recentOrders || []);

  const avgOrderValue =
    customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  return (
    <DashboardLayout>
      <FeatureGate feature="customers">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={() => router.push("/customers")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {customer.fullName || customer.name || "Khách hàng"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Mã định danh: <span className="font-mono text-xs">{customer.id}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đã đồng bộ đa kênh
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Tổng đơn hàng</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {customer.totalOrders} <span className="text-sm font-normal text-gray-500">đơn</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Tổng chi tiêu</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(customer.totalSpent)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Giá trị đơn TB</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(avgOrderValue)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Thông tin liên hệ & Hồ sơ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Số điện thoại (chuẩn hóa)</div>
                  <div className="font-medium text-gray-900 font-mono text-sm mt-0.5">
                    {customer.phone || "-"}
                  </div>
                  {customer.rawPhone && customer.rawPhone !== customer.phone && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Gốc: {customer.rawPhone}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="font-medium text-gray-900 text-sm mt-0.5">
                    {customer.email || "Chưa có email"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Đơn hàng gần nhất</div>
                  <div className="font-medium text-gray-900 text-sm mt-0.5">
                    {customer.lastOrderAt
                      ? format(new Date(customer.lastOrderAt), "dd/MM/yyyy HH:mm")
                      : "-"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Khách hàng từ</div>
                  <div className="font-medium text-gray-900 text-sm mt-0.5">
                    {customer.createdAt
                      ? format(new Date(customer.createdAt), "dd/MM/yyyy")
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Lịch sử đơn hàng ({customerOrders.length})
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Các đơn hàng được liên kết tự động với khách hàng này
                </p>
              </div>
            </div>

            {isOrdersLoading && customerOrders.length === 0 ? (
              <div className="py-8">
                <CardSkeleton />
              </div>
            ) : customerOrders.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                Chưa có đơn hàng nào được ghi nhận
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                {customerOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors gap-3"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <span>{order.orderNumber}</span>
                          <span className="text-xs font-normal px-2 py-0.5 bg-gray-100 rounded text-gray-600 uppercase">
                            {order.channel}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {order.createdAt
                            ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")
                            : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 text-sm">
                          {formatCurrency(Number(order.totalAmount || 0))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={order.status} />
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
