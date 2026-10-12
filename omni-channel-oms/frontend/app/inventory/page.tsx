"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Table, { Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import {
  adjustStock,
  transferStock,
  updateSafetyStock,
  useInventory,
  useInventoryMovements,
} from "@/hooks/useInventory";
import { useWarehouses } from "@/hooks/useWarehouses";
import {
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  Edit2,
  History,
  Info,
  Package,
  Plus,
  Search,
} from "lucide-react";
import {
  calculateAvailableToSell,
  InventoryItem,
  InventoryMovementItem,
} from "@/types/inventory";
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

interface TransferForm {
  fromWarehouseId: string;
  toWarehouseId: string;
  masterSkuId: string;
  quantity: string;
  reason: string;
}

const initialTransferForm: TransferForm = {
  fromWarehouseId: "",
  toWarehouseId: "",
  masterSkuId: "",
  quantity: "",
  reason: "",
};

interface SafetyStockForm {
  masterSkuId: string;
  warehouseId: string;
  skuCode?: string;
  warehouseName?: string;
  safetyStock: string;
}

const initialSafetyStockForm: SafetyStockForm = {
  masterSkuId: "",
  warehouseId: "",
  skuCode: "",
  warehouseName: "",
  safetyStock: "0",
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"inventory" | "movements">(
    "inventory",
  );

  // Inventory list state
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [onlyLowAts, setOnlyLowAts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryLimit = 20;

  // Movements ledger state
  const [movementWarehouseFilter, setMovementWarehouseFilter] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("");
  const [movementsPage, setMovementsPage] = useState(1);
  const movementsLimit = 20;

  // Modals state
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentForm>(
    initialAdjustmentForm,
  );

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferForm, setTransferForm] = useState<TransferForm>(
    initialTransferForm,
  );

  const [isSafetyStockOpen, setIsSafetyStockOpen] = useState(false);
  const [isUpdatingSafetyStock, setIsUpdatingSafetyStock] = useState(false);
  const [safetyStockForm, setSafetyStockForm] = useState<SafetyStockForm>(
    initialSafetyStockForm,
  );

  // Data fetching
  const {
    inventory,
    meta: inventoryMeta,
    isLoading: isInventoryLoading,
    mutate: mutateInventory,
  } = useInventory({
    warehouseId: warehouseFilter || undefined,
    lowStock: onlyLowAts || undefined,
    q: searchQuery.trim() || undefined,
    page: inventoryPage,
    limit: inventoryLimit,
  });

  const {
    movements,
    meta: movementsMeta,
    isLoading: isMovementsLoading,
    mutate: mutateMovements,
  } = useInventoryMovements({
    warehouseId: movementWarehouseFilter || undefined,
    movementType: movementTypeFilter || undefined,
    page: movementsPage,
    limit: movementsLimit,
  });

  const { warehouses } = useWarehouses();

  // Selected source stock for transfer modal helper
  const selectedTransferSourceStock = useMemo(() => {
    if (!transferForm.fromWarehouseId || !transferForm.masterSkuId) return null;
    return inventory.find(
      (item) =>
        item.warehouseId === transferForm.fromWarehouseId &&
        item.masterSkuId === transferForm.masterSkuId,
    );
  }, [inventory, transferForm.fromWarehouseId, transferForm.masterSkuId]);

  // Handle Stock Adjustment
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
      await Promise.all([mutateInventory(), mutateMovements()]);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to adjust stock."));
    } finally {
      setIsAdjusting(false);
    }
  };

  // Handle Inter-warehouse Stock Transfer
  const handleTransferStock = async (): Promise<void> => {
    const quantity = Number(transferForm.quantity);
    if (!transferForm.fromWarehouseId || !transferForm.toWarehouseId) {
      toast.error("Source and destination warehouses are required.");
      return;
    }
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      toast.error("Destination warehouse must be different from source warehouse.");
      return;
    }
    if (!transferForm.masterSkuId) {
      toast.error("Product SKU is required.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Transfer quantity must be greater than 0.");
      return;
    }

    setIsTransferring(true);
    try {
      await transferStock({
        fromWarehouseId: transferForm.fromWarehouseId,
        toWarehouseId: transferForm.toWarehouseId,
        masterSkuId: transferForm.masterSkuId,
        quantity,
        reason: transferForm.reason.trim() || undefined,
        idempotencyKey: createIdempotencyKey("inventory-transfer"),
      });
      toast.success(`Successfully transferred ${quantity} units`);
      setTransferForm(initialTransferForm);
      setIsTransferOpen(false);
      await Promise.all([mutateInventory(), mutateMovements()]);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to transfer stock."));
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle Safety Stock update
  const handleUpdateSafetyStock = async (): Promise<void> => {
    const safetyStockVal = Number(safetyStockForm.safetyStock);
    if (!Number.isFinite(safetyStockVal) || safetyStockVal < 0) {
      toast.error("Safety stock must be 0 or a positive number.");
      return;
    }

    setIsUpdatingSafetyStock(true);
    try {
      await updateSafetyStock({
        masterSkuId: safetyStockForm.masterSkuId,
        warehouseId: safetyStockForm.warehouseId,
        safetyStock: safetyStockVal,
      });
      toast.success("Safety stock threshold updated");
      setIsSafetyStockOpen(false);
      await mutateInventory();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update safety stock."));
    } finally {
      setIsUpdatingSafetyStock(false);
    }
  };

  const openTransferModalFor = (row: InventoryItem) => {
    setTransferForm({
      fromWarehouseId: row.warehouseId,
      toWarehouseId: "",
      masterSkuId: row.masterSkuId,
      quantity: "1",
      reason: "",
    });
    setIsTransferOpen(true);
  };

  const openSafetyStockModalFor = (row: InventoryItem) => {
    setSafetyStockForm({
      masterSkuId: row.masterSkuId,
      warehouseId: row.warehouseId,
      skuCode: row.product?.sku ?? row.skuCode ?? row.masterSkuId,
      warehouseName: row.warehouse?.name ?? row.warehouseName ?? "Warehouse",
      safetyStock: String(row.safetyStock ?? 0),
    });
    setIsSafetyStockOpen(true);
  };

  // Inventory Table Columns
  const inventoryColumns: Column<InventoryItem>[] = [
    {
      key: "product",
      label: "Product",
      render: (_value: unknown, row: InventoryItem) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-body" />
          </div>
          <div>
            <div className="font-medium text-heading">
              {row.productName ?? row.product?.name ?? row.product?.productName ?? "N/A"}
            </div>
            <div className="text-sm font-mono text-body">
              {row.skuCode ?? row.product?.sku ?? row.product?.skuCode ?? "N/A"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "warehouse",
      label: "Warehouse",
      render: (_value: unknown, row: InventoryItem) => (
        <span className="font-medium text-heading">
          {row.warehouseName ?? row.warehouse?.name ?? "N/A"}
        </span>
      ),
    },
    {
      key: "ats",
      label: (
        <div className="flex items-center gap-1.5 cursor-help group relative">
          <span>ATS</span>
          <Info className="w-3.5 h-3.5 text-body group-hover:text-primary" />
          <div className="absolute top-full left-0 z-20 hidden group-hover:block w-64 p-2.5 mt-1 text-xs text-white bg-slate-900 rounded-md shadow-xl normal-case font-normal pointer-events-none">
            <div className="font-semibold mb-1">Available to Sell (ATS)</div>
            <div>Công thức: ATS = max(0, On-hand − Reserved − Safety Stock). Lượng tồn thực tế có thể mở bán trên sàn.</div>
          </div>
        </div>
      ) as unknown as string,
      render: (_value: unknown, row: InventoryItem) => {
        const ats = calculateAvailableToSell(row);
        const isLowStock = ats <= row.safetyStock;
        return (
          <div className="flex items-center gap-2">
            <span
              className={
                isLowStock
                  ? "text-rose-600 font-bold text-base"
                  : "text-emerald-700 font-semibold text-base"
              }
            >
              {ats}
            </span>
            {isLowStock && (
              <span title="Dưới ngưỡng Safety Stock">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "quantity",
      label: "On-hand",
      render: (value: unknown) => (
        <span className="font-medium text-heading">{String(value)}</span>
      ),
    },
    {
      key: "reservedQuantity",
      label: "Reserved",
      render: (value: unknown) => (
        <span className="text-amber-700 font-medium">{String(value)}</span>
      ),
    },
    {
      key: "safetyStock",
      label: "Safety Stock",
      render: (_value: unknown, row: InventoryItem) => (
        <div className="flex items-center gap-2">
          <span className="text-body font-mono">{row.safetyStock ?? 0}</span>
          <button
            type="button"
            onClick={() => openSafetyStockModalFor(row)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
            title="Sửa Safety Stock"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
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
    {
      key: "actions",
      label: "Actions",
      render: (_value: unknown, row: InventoryItem) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTransferModalFor(row)}
            title="Chuyển kho"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
            Transfer
          </Button>
        </div>
      ),
    },
  ];

  // Movements Ledger Table Columns
  const movementColumns: Column<InventoryMovementItem>[] = [
    {
      key: "createdAt",
      label: "Date & Time",
      render: (value: unknown) => {
        if (!value) return "—";
        try {
          return (
            <span className="text-xs text-body font-mono">
              {format(new Date(value as string), "yyyy-MM-dd HH:mm:ss")}
            </span>
          );
        } catch {
          return "—";
        }
      },
    },
    {
      key: "product",
      label: "Product / SKU",
      render: (_value: unknown, row: InventoryMovementItem) => (
        <div>
          <div className="font-medium text-heading text-sm">
            {row.productName || "Product"}
          </div>
          <div className="font-mono text-xs text-body">
            {row.skuCode || row.masterSkuId}
          </div>
        </div>
      ),
    },
    {
      key: "warehouse",
      label: "Warehouse",
      render: (_value: unknown, row: InventoryMovementItem) => (
        <span className="text-sm font-medium text-heading">
          {row.warehouseName || row.warehouseId}
        </span>
      ),
    },
    {
      key: "movementType",
      label: "Movement Type",
      render: (value: unknown) => {
        const type = String(value);
        let variant: "default" | "success" | "warning" | "danger" | "info" =
          "default";
        if (type.includes("IN") || type === "RETURN_RESTOCK" || type === "PURCHASE_RECEIPT") {
          variant = "success";
        } else if (type.includes("OUT") || type === "ORDER_DEDUCT") {
          variant = "danger";
        } else if (type.includes("RESERVE")) {
          variant = "warning";
        } else if (type.includes("RELEASE") || type === "ADJUSTMENT") {
          variant = "info";
        }

        return <Badge variant={variant}>{type}</Badge>;
      },
    },
    {
      key: "quantityDelta",
      label: "Qty Delta",
      render: (value: unknown) => {
        const delta = Number(value || 0);
        if (delta > 0) {
          return (
            <span className="font-semibold font-mono text-emerald-600">
              +{delta}
            </span>
          );
        }
        if (delta < 0) {
          return (
            <span className="font-semibold font-mono text-rose-600">
              {delta}
            </span>
          );
        }
        return <span className="text-body font-mono">0</span>;
      },
    },
    {
      key: "reservedDelta",
      label: "Reserved Delta",
      render: (value: unknown) => {
        const delta = Number(value || 0);
        if (delta > 0) {
          return (
            <span className="font-semibold font-mono text-amber-600">
              +{delta}
            </span>
          );
        }
        if (delta < 0) {
          return (
            <span className="font-semibold font-mono text-sky-600">
              {delta}
            </span>
          );
        }
        return <span className="text-body font-mono">0</span>;
      },
    },
    {
      key: "orderId",
      label: "Reference",
      render: (_value: unknown, row: InventoryMovementItem) => {
        if (row.orderId) {
          return (
            <span className="font-mono text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
              Order: {row.orderId.slice(0, 8)}...
            </span>
          );
        }
        if (row.idempotencyKey) {
          return (
            <span className="font-mono text-xs text-slate-500 truncate max-w-[120px] block" title={row.idempotencyKey}>
              {row.idempotencyKey.slice(0, 16)}...
            </span>
          );
        }
        return <span className="text-body text-xs">—</span>;
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-heading">Inventory & Warehouses</h1>
            <p className="text-body mt-1">
              Quản lý tồn kho theo thời gian thực, available-to-sell (ATS), luân chuyển kho và nhật ký biến động ledger.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setTransferForm(initialTransferForm);
                setIsTransferOpen(true);
              }}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transfer Stock
            </Button>
            <Button variant="primary" onClick={() => setIsAdjustOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adjust Stock
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "inventory"
                ? "border-primary text-primary"
                : "border-transparent text-body hover:text-heading"
            }`}
          >
            <Boxes className="w-4 h-4" />
            Stock On Hand (ATS)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("movements")}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "movements"
                ? "border-primary text-primary"
                : "border-transparent text-body hover:text-heading"
            }`}
          >
            <History className="w-4 h-4" />
            Movements Ledger
          </button>
        </div>

        {/* TAB 1: Stock On Hand */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-heading uppercase mb-1">
                  Search SKU / Product
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-body absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setInventoryPage(1);
                    }}
                    placeholder="Search by SKU code or product name..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex flex-col gap-1 text-sm font-medium text-heading min-w-[200px]">
                Warehouse
                <select
                  value={warehouseFilter}
                  onChange={(event) => {
                    setWarehouseFilter(event.target.value);
                    setInventoryPage(1);
                  }}
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

              <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-heading cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={onlyLowAts}
                  onChange={(event) => {
                    setOnlyLowAts(event.target.checked);
                    setInventoryPage(1);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary"
                />
                Low or Zero ATS only
              </label>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <Table
                data={inventory}
                columns={inventoryColumns}
                isLoading={isInventoryLoading}
                emptyMessage="No inventory records found for the selected filters"
                getRowId={(item) => item.id}
              />
              {inventoryMeta && inventoryMeta.totalPages > 1 && (
                <Pagination
                  currentPage={inventoryPage}
                  totalPages={inventoryMeta.totalPages}
                  pageSize={inventoryLimit}
                  totalItems={inventoryMeta.total}
                  onPageChange={(page) => setInventoryPage(page)}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Movements Ledger */}
        {activeTab === "movements" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 md:flex-row md:items-end">
              <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-heading">
                Warehouse
                <select
                  value={movementWarehouseFilter}
                  onChange={(event) => {
                    setMovementWarehouseFilter(event.target.value);
                    setMovementsPage(1);
                  }}
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

              <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-heading">
                Movement Type
                <select
                  value={movementTypeFilter}
                  onChange={(event) => {
                    setMovementTypeFilter(event.target.value);
                    setMovementsPage(1);
                  }}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
                >
                  <option value="">All movement types</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                  <option value="TRANSFER_IN">TRANSFER_IN</option>
                  <option value="TRANSFER_OUT">TRANSFER_OUT</option>
                  <option value="ORDER_RESERVE">ORDER_RESERVE</option>
                  <option value="ORDER_RELEASE">ORDER_RELEASE</option>
                  <option value="ORDER_DEDUCT">ORDER_DEDUCT</option>
                  <option value="PURCHASE_RECEIPT">PURCHASE_RECEIPT</option>
                  <option value="RETURN_RESTOCK">RETURN_RESTOCK</option>
                  <option value="CYCLE_COUNT">CYCLE_COUNT</option>
                </select>
              </label>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <Table
                data={movements}
                columns={movementColumns}
                isLoading={isMovementsLoading}
                emptyMessage="No ledger movements recorded yet"
                getRowId={(item) => item.id}
              />
              {movementsMeta && movementsMeta.totalPages > 1 && (
                <Pagination
                  currentPage={movementsPage}
                  totalPages={movementsMeta.totalPages}
                  pageSize={movementsLimit}
                  totalItems={movementsMeta.total}
                  onPageChange={(page) => setMovementsPage(page)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Adjust Stock */}
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
                  {item.skuCode ?? item.product?.sku ?? item.masterSkuId}
                  {" · "}
                  {item.warehouseName ?? item.warehouse?.name ?? item.warehouseId}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdjustOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isAdjusting}>
              Save adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Transfer Stock */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Inter-Warehouse Stock Transfer"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleTransferStock();
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-heading">
              Source Warehouse (From)
              <select
                value={transferForm.fromWarehouseId}
                onChange={(event) => {
                  setTransferForm((prev) => ({
                    ...prev,
                    fromWarehouseId: event.target.value,
                  }));
                }}
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              >
                <option value="">Select source warehouse</option>
                {warehouses
                  .filter((w) => w.isActive !== false)
                  .map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-heading">
              Destination Warehouse (To)
              <select
                value={transferForm.toWarehouseId}
                onChange={(event) => {
                  setTransferForm((prev) => ({
                    ...prev,
                    toWarehouseId: event.target.value,
                  }));
                }}
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              >
                <option value="">Select destination warehouse</option>
                {warehouses
                  .filter(
                    (w) =>
                      w.isActive !== false &&
                      w.id !== transferForm.fromWarehouseId,
                  )
                  .map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-heading">
            Product SKU
            <select
              value={transferForm.masterSkuId}
              onChange={(event) => {
                setTransferForm((prev) => ({
                  ...prev,
                  masterSkuId: event.target.value,
                }));
              }}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            >
              <option value="">Select SKU to transfer</option>
              {inventory
                .filter(
                  (item) =>
                    !transferForm.fromWarehouseId ||
                    item.warehouseId === transferForm.fromWarehouseId,
                )
                .map((item) => (
                  <option key={item.id} value={item.masterSkuId}>
                    {item.skuCode ?? item.product?.sku ?? item.masterSkuId} —{" "}
                    {item.productName ?? item.product?.name ?? "Product"} (On-hand:{" "}
                    {item.quantity})
                  </option>
                ))}
            </select>
          </label>

          {selectedTransferSourceStock && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 flex justify-between">
              <span>
                On-hand tại kho gửi:{" "}
                <strong>{selectedTransferSourceStock.quantity}</strong>
              </span>
              <span>
                ATS khả dụng:{" "}
                <strong className="text-emerald-700">
                  {calculateAvailableToSell(selectedTransferSourceStock)}
                </strong>
              </span>
            </div>
          )}

          <Input
            label="Transfer Quantity"
            type="number"
            min="1"
            value={transferForm.quantity}
            onChange={(event) =>
              setTransferForm((prev) => ({
                ...prev,
                quantity: event.target.value,
              }))
            }
            placeholder="Quantity to move"
            required
          />

          <Input
            label="Reason / Transfer Note"
            value={transferForm.reason}
            onChange={(event) =>
              setTransferForm((prev) => ({
                ...prev,
                reason: event.target.value,
              }))
            }
            placeholder="Stock rebalancing between branches"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransferOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isTransferring}>
              Transfer Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Update Safety Stock */}
      <Modal
        isOpen={isSafetyStockOpen}
        onClose={() => setIsSafetyStockOpen(false)}
        title="Configure Safety Stock Threshold"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleUpdateSafetyStock();
          }}
        >
          <div className="text-sm text-body space-y-1 bg-slate-50 p-3 rounded-lg border border-border">
            <div>
              Product:{" "}
              <strong className="text-heading font-mono">
                {safetyStockForm.skuCode}
              </strong>
            </div>
            <div>
              Warehouse:{" "}
              <strong className="text-heading">
                {safetyStockForm.warehouseName}
              </strong>
            </div>
          </div>

          <Input
            label="Safety Stock (Mức tồn an toàn)"
            type="number"
            min="0"
            value={safetyStockForm.safetyStock}
            onChange={(event) =>
              setSafetyStockForm((prev) => ({
                ...prev,
                safetyStock: event.target.value,
              }))
            }
            placeholder="0"
            required
          />
          <p className="text-xs text-body">
            Mức tồn an toàn sẽ được trừ trực tiếp khỏi ATS:{" "}
            <code>ATS = max(0, On-hand - Reserved - Safety Stock)</code>.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSafetyStockOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isUpdatingSafetyStock}>
              Save Threshold
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
