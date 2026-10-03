/**
 * Customer Details Page
 * Comprehensive customer view with order history and stats
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
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { OrderStatusBadge } from "@/components/ui/Badge";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { customer, isLoading } = useCustomer(customerId);
  const { orders } = useOrders(); // TODO: Filter by customer ID

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Customer not found
          </h2>
          <Button variant="secondary" onClick={() => router.push("/customers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const customerOrders =
    orders?.filter((order) => order.customerName === customer.name) || [];

  const avgOrderValue =
    customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => router.push("/customers")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-heading">
                {customer.name}
              </h1>
              <p className="text-body mt-1">Customer Details</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push(`/customers/${customerId}/edit`)}
          >
            Edit Customer
          </Button>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium text-gray-900">
                  {customer.email}
                </div>
              </div>
            </div>
            {customer.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="font-medium text-gray-900">
                    {customer.phone}
                  </div>
                </div>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="font-medium text-gray-900">
                    {customer.address}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Customer Since</div>
                <div className="font-medium text-gray-900">
                  {format(new Date(customer.createdAt), "MMMM dd, yyyy")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Orders</div>
                <div className="text-2xl font-bold text-gray-900">
                  {customer.totalOrders}
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Spent</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${customer.totalSpent.toLocaleString()}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">
                  Avg Order Value
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${avgOrderValue.toFixed(2)}
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order History ({customerOrders.length})
          </h2>
          {customerOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No orders yet</div>
          ) : (
            <div className="space-y-3">
              {customerOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {order.orderNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(order.createdAt), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {order.items?.length || 0} items
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
