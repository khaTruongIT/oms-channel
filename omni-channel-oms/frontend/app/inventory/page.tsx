"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Table, { Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { adjustStock, useInventory } from "@/hooks/useInventory";
import { useWarehouses } from "@/hooks/useWarehouses";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { calculateAvailableToSell, InventoryItem } from "@/types/inventory";
import { createIdempotencyKey } from "@/lib/idempotency";
import { getApiErrorMessage } from "@/lib/api-error";

interface AdjustmentForm {
  masterSkuId: string;
  warehouseId: string;
  quantity: string;
  reason: string;
}

const initialAdjustmentForm: AdjustmentForm = {
  masterSkuId: "",
  warehouseId: "",
  quantity: "",
  reason: "",
};

export default function InventoryPage() {
  const { inventory, isLoading, mutate } = useInventory();
  const { warehouses } = useWarehouses();
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [onlyLowAts, setOnlyLowAts] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentForm>(
    initialAdjustmentForm,
  );

  const filteredInventory = useMemo(
    () =>
      inventory.filter((item) => {
        const ats = calculateAvailableToSell(item);
        const matchesWarehouse =
          !warehouseFilter || item.warehouseId === warehouseFilter;
        const matchesLowAts = !onlyLowAts || ats <= 0 || ats <= item.safetyStock;
        return matchesWarehouse && matchesLowAts;
      }),
    [inventory, onlyLowAts, warehouseFilter],
  );

  const handleAdjustStock = async (): Promise<void> => {
    const quantity = Number(adjustmentForm.quantity);
    if (!adjustmentForm.masterSkuId || !adjustmentForm.warehouseId) {
      toast.error("Product and warehouse are required.");
      return;
    }
    if (!Number.isFinite(quantity)) {
      toast.error("Quantity must be a valid number.");
      return;
    }
    if (!adjustmentForm.reason.trim()) {
      toast.error("Reason is required for audit history.");
      return;
    }

    setIsAdjusting(true);
    try {
      await adjustStock({
        masterSkuId: adjustmentForm.masterSkuId,
        warehouseId: adjustmentForm.warehouseId,
        quantity,
        reason: adjustmentForm.reason.trim(),
        idempotencyKey: createIdempotencyKey("inventory-adjust"),
      });
      toast.success("Stock adjustment recorded");
      setAdjustmentForm(initialAdjustmentForm);
      setIsAdjustOpen(false);
      await mutate();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to adjust stock."));
    } finally {
      setIsAdjusting(false);
    }
  };

  const columns: Column<InventoryItem>[] = [
    {
      key: "product",
      label: "Product",
      render: (_value: unknown, row: InventoryItem) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-body" />
          </div>
          <div>
            <div className="font-medium text-heading">
              {row.product?.name ?? row.product?.productName ?? "N/A"}
            </div>
            <div className="text-sm text-body">
              {row.product?.sku ?? row.product?.skuCode ?? "N/A"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "warehouse",
      label: "Warehouse",
      render: (_value: unknown, row: InventoryItem) => (
        <span className="text-heading">{row.warehouse?.name || "N/A"}</span>
      ),
    },
    {
      key: "availableToSell",
      label: "ATS",
      sortable: true,
      render: (_value: unknown, row: InventoryItem) => {
        const ats = calculateAvailableToSell(row);
        const isLowStock = ats <= row.safetyStock;
        return (
          <div className="flex items-center gap-2">
            <span
              className={
                isLowStock ? "text-danger font-semibold" : "font-medium"
              }
            >
              {ats}
            </span>
            {isLowStock && <AlertTriangle className="w-4 h-4 text-warning" />}
          </div>
        );
      },
    },
    {
      key: "quantity",
      label: "On hand",
      render: (value: unknown) => <span className="text-body">{String(value)}</span>,
    },
    {
      key: "reservedQuantity",
      label: "Reserved",
      render: (value: unknown) => <span className="text-body">{String(value)}</span>,
    },
    {
      key: "safetyStock",
      label: "Safety Stock",
      render: (value: unknown) => <span className="text-body">{String(value)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (_value: unknown, row: InventoryItem) => {
        const ats = calculateAvailableToSell(row);
        const isLowStock = ats <= row.safetyStock;
        const isOutOfStock = ats === 0;

        if (isOutOfStock) {
          return <Badge variant="danger">No ATS</Badge>;
        }
        if (isLowStock) {
          return <Badge variant="warning">Low ATS</Badge>;
        }
        return <Badge variant="success">Publishable</Badge>;
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-heading">Inventory</h1>
          <p className="text-body mt-1">
            Track on-hand stock, reservations, safety stock, and available-to-sell.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 md:flex-row md:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-heading">
            Warehouse
            <select
              value={warehouseFilter}
              onChange={(event) => setWarehouseFilter(event.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
            >
              <option value="">All warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-heading">
            <input
              type="checkbox"
              checked={onlyLowAts}
              onChange={(event) => setOnlyLowAts(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary"
            />
            Low or zero ATS only
          </label>
          <Button variant="primary" onClick={() => setIsAdjustOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adjust stock
          </Button>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <Table
            data={filteredInventory}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No inventory matches the selected filters"
            getRowId={(item) => item.id}
          />
        </div>
      </div>

      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Adjust stock"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleAdjustStock();
          }}
        >
          <label className="block text-sm font-medium text-heading">
            Inventory row
            <select
              value={`${adjustmentForm.masterSkuId}|${adjustmentForm.warehouseId}`}
              onChange={(event) => {
                const [masterSkuId, warehouseId] = event.target.value.split("|");
                setAdjustmentForm((current) => ({
                  ...current,
                  masterSkuId: masterSkuId ?? "",
                  warehouseId: warehouseId ?? "",
                }));
              }}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="|">Select inventory</option>
              {inventory.map((item) => (
                <option
                  key={item.id}
                  value={`${item.masterSkuId}|${item.warehouseId}`}
                >
                  {item.product?.sku ?? item.product?.skuCode ?? item.masterSkuId}
                  {" · "}
                  {item.warehouse?.name ?? item.warehouseId}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Adjustment quantity"
            type="number"
            value={adjustmentForm.quantity}
            onChange={(event) =>
              setAdjustmentForm((current) => ({
                ...current,
                quantity: event.target.value,
              }))
            }
            placeholder="Use negative numbers to reduce stock"
          />
          <Input
            label="Reason"
            value={adjustmentForm.reason}
            onChange={(event) =>
              setAdjustmentForm((current) => ({
                ...current,
                reason: event.target.value,
              }))
            }
            placeholder="Cycle count correction"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isAdjusting}>
              Save adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
