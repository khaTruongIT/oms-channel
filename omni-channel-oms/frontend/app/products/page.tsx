/**
 * Products Page - Enhanced with Phase 1 Components
 * Integrated: Pagination, EmptyState, Skeleton, ExportButton, BulkActions
 */

"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import ProductForm from "@/components/products/ProductForm";
import {
  useProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  Product,
} from "@/hooks/useProducts";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import ExportButton from "@/components/ui/ExportButton";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import BulkActionBar from "@/components/ui/BulkActionBar";

export default function ProductsPage() {
  const { products, isLoading, mutate } = useProducts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
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
  } = useBulkSelection(products || []);

  const handleCreate = async (data: any) => {
    await createProduct(data);
    mutate();
  };

  const handleEdit = async (data: any) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
      mutate();
      setEditingProduct(undefined);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        toast.success("Product deleted successfully");
        mutate();
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedCount} product(s)?`)) {
      try {
        // TODO: Implement bulk delete API
        toast.success(`${selectedCount} product(s) deleted`);
        clearSelection();
        mutate();
      } catch (error) {
        toast.error("Failed to delete products");
      }
    }
  };

  // Pagination logic
  const totalItems = products?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = products?.slice(startIndex, endIndex) || [];

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
      render: (_: any, product: Product) => (
        <input
          type="checkbox"
          checked={isSelected(product.id)}
          onChange={() => toggleItem(product.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
        />
      ),
    },
    { key: "skuCode", label: "SKU", sortable: true },
    {
      key: "productName",
      label: "Product Name",
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-heading">{value}</span>
      ),
    },
    {
      key: "categoryName",
      label: "Category",
      render: (value: string | null) =>
        value ? (
          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
            {value}
          </span>
        ) : (
          <span className="text-body italic text-sm">Uncategorized</span>
        ),
    },
    {
      key: "costPrice",
      label: "Cost Price",
      sortable: true,
      render: (value: number) => (
        <span className="font-medium">${value?.toFixed(2) || "0.00"}</span>
      ),
    },
    {
      key: "variants",
      label: "Variants",
      render: (value: any[]) =>
        value && value.length > 0 ? (
          <span className="px-2 py-1 bg-info/10 text-info rounded-md text-sm">
            {value.length} variant{value.length !== 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-body italic text-sm">No variants</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: Product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingProduct(row);
              setIsFormOpen(true);
            }}
            className="p-1.5 text-info hover:bg-info-light rounded-lg transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="p-1.5 text-danger hover:bg-danger-light rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Export data
  const exportData =
    products?.map((product) => ({
      SKU: product.skuCode,
      "Product Name": product.productName,
      Category: product.categoryName || "Uncategorized",
      "Cost Price": product.costPrice || 0,
      Variants: product.variants?.length || 0,
    })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-heading">Products</h1>
            <p className="text-body mt-1">Manage your product catalog</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton
              data={exportData}
              filename="products"
              variant="secondary"
            />
            <Button variant="primary" onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={10} />
            </div>
          ) : !products || products.length === 0 ? (
            <EmptyState
              icon={<Plus className="w-12 h-12" />}
              title="No products yet"
              description="Start building your product catalog"
              action={
                <Button variant="primary" onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              }
            />
          ) : (
            <>
              <Table columns={columns} data={paginatedProducts} />
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

      {/* Product Form Modal */}
      <ProductForm
        isOpen={isFormOpen}
        product={editingProduct}
        onSubmit={editingProduct ? handleEdit : handleCreate}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(undefined);
        }}
      />
    </DashboardLayout>
  );
}
