"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import CategoryForm from "@/components/categories/CategoryForm";
import {
  useCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  Category,
} from "@/hooks/useCategories";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CategoriesPage() {
  const { categories, isLoading, mutate } = useCategories();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    Category | undefined
  >();

  const handleCreate = async (data: any) => {
    await createCategory(data);
    mutate();
  };

  const handleEdit = async (data: any) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
      mutate();
      setEditingCategory(undefined);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id);
        toast.success("Category deleted");
        mutate();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Delete failed");
      }
    }
  };

  const columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "description", label: "Description" },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: Category) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingCategory(row);
              setIsFormOpen(true);
            }}
            className="p-1.5 text-info hover:bg-info-light rounded-lg transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-danger hover:bg-danger-light rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-heading">Categories</h1>
            <p className="text-body mt-1">Manage your product categories</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setEditingCategory(undefined);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <Table data={categories} columns={columns} isLoading={isLoading} />
        </div>
      </div>

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(undefined);
        }}
        onSubmit={editingCategory ? handleEdit : handleCreate}
        category={editingCategory}
      />
    </DashboardLayout>
  );
}
