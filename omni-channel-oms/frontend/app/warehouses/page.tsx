"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import WarehouseForm from "@/components/warehouses/WarehouseForm";
import {
  useWarehouses,
  createWarehouse,
  deleteWarehouse,
  Warehouse,
} from "@/hooks/useWarehouses";
import { Plus, Edit, Trash2, Building2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";

export default function WarehousesPage() {
  const { warehouses, isLoading, mutate } = useWarehouses();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<
    Warehouse | undefined
  >();

  const handleCreate = async (data: any) => {
    try {
      await createWarehouse(data);
      toast.success("Warehouse created successfully");
      mutate();
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create warehouse",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      try {
        await deleteWarehouse(id);
        toast.success("Warehouse deleted");
        mutate();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Delete failed");
      }
    }
  };

  const columns = [
    {
      key: "name",
      label: "Warehouse",
      render: (_: any, row: Warehouse) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-info rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-heading flex items-center gap-2">
              {row.name}
              {row.isDefault && (
                <Star className="w-4 h-4 text-warning fill-warning" />
              )}
            </div>
            {row.location && (
              <div className="text-sm text-body flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {row.location}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "address",
      label: "Address",
      render: (value: string) => (
        <span className="text-body">{value || "-"}</span>
      ),
    },
    {
      key: "isDefault",
      label: "Status",
      render: (value: boolean) =>
        value ? (
          <Badge variant="success">Default</Badge>
        ) : (
          <Badge variant="default">Active</Badge>
        ),
    },
    {
      key: "actions",
      label: "",
      render: (_: any, row: Warehouse) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingWarehouse(row);
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
            <h1 className="text-2xl font-bold text-heading">Warehouses</h1>
            <p className="text-body mt-1">Manage your warehouse locations</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setEditingWarehouse(undefined);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Warehouse
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-body">Total Warehouses</p>
                <p className="text-2xl font-bold text-heading">
                  {warehouses.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-info rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-body">Default Warehouse</p>
                <p className="text-lg font-bold text-heading">
                  {warehouses.find((w) => w.isDefault)?.name || "Not set"}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-warning rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-body">Active Locations</p>
                <p className="text-2xl font-bold text-heading">
                  {warehouses.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-success rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Warehouses Table */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <Table data={warehouses} columns={columns} isLoading={isLoading} />
        </div>
      </div>

      {/* Warehouse Form Modal */}
      <WarehouseForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingWarehouse(undefined);
        }}
        onSubmit={handleCreate}
        warehouse={editingWarehouse}
      />
    </DashboardLayout>
  );
}
