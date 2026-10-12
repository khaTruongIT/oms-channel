/**
 * Warehouse Details Page
 * Real data view with active warehouse details and edit/delete actions
 */

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CardSkeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import WarehouseForm from "@/components/warehouses/WarehouseForm";
import {
  useWarehouse,
  useWarehouseSummary,
  deleteWarehouse,
} from "@/hooks/useWarehouses";
import {
  ArrowLeft,
  Building2,
  Edit,
  Trash2,
  MapPin,
  Star,
  Layers,
  AlertCircle,
  ExternalLink,
  Package,
  Boxes,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

export default function WarehouseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;

  const { warehouse, isLoading, isError, mutate } = useWarehouse(warehouseId);
  const { summary } = useWarehouseSummary(warehouseId);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!warehouse) return;
    if (confirm("Are you sure you want to delete this warehouse?")) {
      try {
        setIsDeleting(true);
        await deleteWarehouse(warehouse.id);
        toast.success("Warehouse deleted successfully");
        router.push("/warehouses");
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to delete warehouse",
        );
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !warehouse) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button
            variant="secondary"
            onClick={() => router.push("/warehouses")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Warehouses
          </Button>

          <div className="bg-white rounded-xl shadow-card p-8 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 bg-danger-light rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-danger" />
            </div>
            <h2 className="text-xl font-bold text-heading mb-2">
              Warehouse Not Found
            </h2>
            <p className="text-body text-sm mb-6">
              The requested warehouse ID could not be loaded or may have been deleted.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push("/warehouses")}
            >
              Return to Warehouses List
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => router.push("/warehouses")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-heading">
                  {warehouse.name}
                </h1>
                {warehouse.isDefault && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    Default
                  </Badge>
                )}
                {warehouse.isActive !== false ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="danger">Inactive</Badge>
                )}
              </div>
              <p className="text-body mt-1 text-sm">
                ID: <span className="font-mono text-xs">{warehouse.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Warehouse
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Warehouse
            </Button>
          </div>
        </div>

        {/* Live Inventory Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Master SKUs
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {summary ? summary.totalSkus : "—"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  SKUs registered in warehouse
                </div>
              </div>
              <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total On-Hand
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {summary ? summary.totalOnHand : "—"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Reserved: <span className="text-amber-700 font-medium">{summary?.totalReserved ?? 0}</span>
                </div>
              </div>
              <div className="w-11 h-11 bg-amber-50 rounded-lg flex items-center justify-center">
                <Boxes className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Available to Sell (ATS)
                </div>
                <div className="text-2xl font-bold text-emerald-700 mt-1">
                  {summary ? summary.totalAvailable : "—"}
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  Publishable to sales channels
                </div>
              </div>
              <div className="w-11 h-11 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Inventory Valuation
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {summary
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(summary.totalStockValue)
                    : "—"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Based on SKU cost prices
                </div>
              </div>
              <div className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-slate-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location & Contact */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              Location Details
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase">
                  Location Area / City
                </div>
                <div className="text-sm font-medium text-gray-900 mt-1">
                  {warehouse.location || "Chưa thiết lập vị trí"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase">
                  Full Address
                </div>
                <div className="text-sm font-medium text-gray-900 mt-1">
                  {warehouse.address || "Chưa cập nhật địa chỉ chi tiết"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase">
                  Status
                </div>
                <div className="text-sm font-medium text-gray-900 mt-1">
                  {warehouse.isActive !== false ? "Active warehouse location" : "Inactive / Archived location"}
                </div>
              </div>
            </div>
          </div>

          {/* Real Warehouse Inventory Overview */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-gray-500" />
                Inventory Stock Control
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/inventory?warehouseId=${warehouse.id}`)}
              >
                View Stock Table <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 text-sm">
                <span className="text-gray-600">Active SKUs with Stock</span>
                <span className="font-semibold text-gray-900 font-mono">
                  {summary?.totalSkus ?? 0} SKUs
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 text-sm">
                <span className="text-gray-600">On-hand Units</span>
                <span className="font-semibold text-gray-900 font-mono">
                  {summary?.totalOnHand ?? 0} units
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 text-sm">
                <span className="text-gray-600">Committed / Reserved Units</span>
                <span className="font-semibold text-amber-700 font-mono">
                  {summary?.totalReserved ?? 0} units
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 text-sm">
                <span className="text-emerald-900 font-medium">Available to Sell (ATS)</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {summary?.totalAvailable ?? 0} units
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Warehouse Modal */}
      <WarehouseForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={async () => {
          await mutate();
          toast.success("Warehouse updated successfully");
        }}
        warehouse={warehouse}
      />
    </DashboardLayout>
  );
}
