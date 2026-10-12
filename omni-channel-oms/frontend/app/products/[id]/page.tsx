/**
 * Product Details Page
 * Comprehensive product view with gallery, variants, and inventory
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useProduct } from "@/hooks/useProducts";
import { useProductInventory } from "@/hooks/useInventory";
import ProductInventory from "@/components/products/ProductInventory";
import { CardSkeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  Barcode,
  Tag,
} from "lucide-react";
import { format } from "date-fns";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { product, isLoading: isProductLoading } = useProduct(productId);
  const { inventory: warehouseInventory, isLoading: isInventoryLoading } =
    useProductInventory(productId);

  const stockByWarehouse = (warehouseInventory || []).map((item) => ({
    warehouseId: item.warehouseId,
    warehouseName: item.warehouseName || item.warehouse?.name || "Warehouse",
    available:
      item.ats ??
      item.availableQuantity ??
      Math.max(0, item.quantity - item.reservedQuantity - item.safetyStock),
    reserved: item.reservedQuantity,
    total: item.quantity,
  }));

  const totalStock = stockByWarehouse.reduce((acc, curr) => acc + curr.total, 0);
  const totalAvailable = stockByWarehouse.reduce(
    (acc, curr) => acc + curr.available,
    0,
  );
  const totalReserved = stockByWarehouse.reduce(
    (acc, curr) => acc + curr.reserved,
    0,
  );

  if (isProductLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Product not found
          </h2>
          <Button variant="secondary" onClick={() => router.push("/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => router.push("/products")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-heading">
                {product.productName}
              </h1>
              <p className="text-body mt-1">Product Details</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push(`/products/${productId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Product
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-400" />
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Product Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Barcode className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">SKU</div>
                    <div className="font-mono font-medium text-gray-900">
                      {product.skuCode}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Cost Price</div>
                    <div className="font-semibold text-gray-900">
                      ${product.costPrice?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Category</div>
                    <div className="font-medium text-gray-900">
                      {product.categoryName || "Uncategorized"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="font-medium text-gray-900">
                      {format(new Date(product.createdAt), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory by Warehouse */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Inventory Allocation by Warehouse
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/inventory?q=${product.skuCode}`)}
                >
                  Manage in ATS Table
                </Button>
              </div>
              <ProductInventory
                inventory={stockByWarehouse}
                onTransfer={(fromWarehouse) => {
                  router.push(`/inventory?warehouseId=${fromWarehouse}&q=${product.skuCode}`);
                }}
              />
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Total Stock (On-Hand)</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {isInventoryLoading ? "—" : totalStock}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Available to Sell (ATS)</div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {isInventoryLoading ? "—" : totalAvailable}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Committed / Reserved</div>
                  <div className="text-2xl font-bold text-amber-700">
                    {isInventoryLoading ? "—" : totalReserved}
                  </div>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Variants
              </h3>
              <div className="text-center py-4 text-gray-500 text-sm">
                No variants configured
              </div>
            </div>

            {/* Related Products */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Related Products
              </h3>
              <div className="text-center py-4 text-gray-500 text-sm">
                No related products
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
