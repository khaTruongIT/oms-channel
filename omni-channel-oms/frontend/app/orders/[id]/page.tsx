"use client";

import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { useOrder, updateOrderStatus, Order } from "@/hooks/useOrders";
import {
  ArrowLeft,
  Package,
  User,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import type { OrderStatus } from "@/types/orders";

const statusFlow: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { order, isLoading, mutate } = useOrder(orderId);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      await mutate();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update status"));
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= statusFlow.length - 1)
      return null;
    return statusFlow[currentIndex + 1];
  };

  const calculateTotal = (items: Order["items"]) => {
    return (
      items?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-heading">
            Order not found
          </h2>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const nextStatus = getNextStatus(order.status);
  const total = calculateTotal(order.items);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-secondary-100 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-body" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-heading">
                Order #{order.orderNumber}
              </h1>
              <p className="text-body mt-1">
                {format(new Date(order.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            {nextStatus && order.status !== "CANCELLED" && (
              <Button
                variant="primary"
                onClick={() => void handleStatusUpdate(nextStatus)}
                isLoading={isUpdating}
              >
                Mark as {nextStatus}
              </Button>
            )}
            {order.status === "PENDING" && (
              <Button
                variant="danger"
                onClick={() => void handleStatusUpdate("CANCELLED")}
                isLoading={isUpdating}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-semibold text-heading mb-4">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-body" />
                  </div>
                  <div>
                    <p className="text-sm text-body">Name</p>
                    <p className="font-medium text-heading">
                      {order.customerName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-body" />
                  </div>
                  <div>
                    <p className="text-sm text-body">Phone</p>
                    <p className="font-medium text-heading">
                      {order.customerPhone || "-"}
                    </p>
                  </div>
                </div>
                {order.shippingAddress && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-body" />
                    </div>
                    <div>
                      <p className="text-sm text-body">Shipping Address</p>
                      <p className="font-medium text-heading">
                        {order.shippingAddress}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-secondary-200">
                <h3 className="text-lg font-semibold text-heading">
                  Order Items
                </h3>
              </div>
              <div className="divide-y divide-secondary-200">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-body" />
                      </div>
                      <div>
                        <p className="font-medium text-heading">
                          {item.product?.name ??
                            item.product?.productName ??
                            "Unknown Product"}
                        </p>
                        <p className="text-sm text-body">
                          SKU: {item.product?.sku ?? item.product?.skuCode ?? item.masterSkuId}
                        </p>
                        <p className="text-xs text-body">
                          Warehouse: {item.warehouseId ?? "Allocated warehouse unavailable"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-heading">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-body">
                        {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-semibold text-heading mb-4">
                Order Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-body">Channel</span>
                  <span className="font-medium text-heading capitalize">
                    {order.channel}
                  </span>
                </div>
                {order.channelAccountId && (
                  <div className="flex justify-between gap-4">
                    <span className="text-body">Account</span>
                    <code className="truncate rounded bg-secondary-100 px-2 py-1 text-xs text-heading">
                      {order.channelAccountId}
                    </code>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-body">External ID</span>
                  <code className="truncate rounded bg-secondary-100 px-2 py-1 text-xs text-heading">
                    {order.externalOrderId}
                  </code>
                </div>
                {order.externalStatus && (
                  <div className="flex justify-between">
                    <span className="text-body">External status</span>
                    <span className="font-medium text-heading">
                      {order.externalStatus}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-body">Items</span>
                  <span className="font-medium text-heading">
                    {order.items?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body">Subtotal</span>
                  <span className="font-medium text-heading">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <hr className="border-secondary-200" />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-heading">Total</span>
                  <span className="font-bold text-primary">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-semibold text-heading mb-4">
                Order Timeline
              </h3>
              <div className="space-y-4">
                {statusFlow.map((status, index) => {
                  const isActive = statusFlow.indexOf(order.status) >= index;
                  const isCurrent = order.status === status;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive ? "bg-gradient-success" : "bg-secondary-200"
                        }`}
                      >
                        {isActive ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <Clock className="w-4 h-4 text-body" />
                        )}
                      </div>
                      <span
                        className={`font-medium ${isCurrent ? "text-primary" : isActive ? "text-heading" : "text-body"}`}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })}
                {order.status === "CANCELLED" && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-danger">
                      <XCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-danger">CANCELLED</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
