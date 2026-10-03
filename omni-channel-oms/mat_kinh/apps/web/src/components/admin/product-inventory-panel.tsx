"use client";

import { useState, useTransition } from "react";
import type { Product } from "@optiqis/shared";
import { Boxes, Save } from "lucide-react";
import { adjustInventoryAction } from "@/app/admin/products/actions";
import type { AdminInventoryItem, AdminWarehouse } from "@/lib/api";
import { Button, FieldShell, MetricCard } from "@/components/ui/primitives";

export function ProductInventoryPanel({
  product,
  inventory,
  warehouses,
}: {
  product: Product;
  inventory: AdminInventoryItem[];
  warehouses: AdminWarehouse[];
}) {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("Điều chỉnh từ OPTIQIS CMS");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const total = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const reserved = inventory.reduce((sum, item) => sum + item.reservedQuantity, 0);
  const available = inventory.reduce((sum, item) => sum + item.availableQuantity, 0);

  function submit(): void {
    startTransition(async () => {
      try {
        await adjustInventoryAction({
          masterSkuId: product.id,
          warehouseId,
          quantity,
          reason,
        });
        setMessage("Đã điều chỉnh tồn kho trong OMS.");
      } catch (error: unknown) {
        setMessage(error instanceof Error ? error.message : "Không thể điều chỉnh tồn kho.");
      }
    });
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
        <Boxes size={15} />
        OMS Inventory
      </div>
      <h1 className="mt-4 text-3xl font-extrabold text-[color:var(--primary)]">{product.name}</h1>
      <p className="mt-2 text-sm text-[color:var(--muted)]">SKU/Master ID: {product.id}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard detail="Tổng quantity trong OMS" label="Tổng tồn" value={total} />
        <MetricCard detail="Đã giữ cho đơn hàng" label="Reserved" tone="amber" value={reserved} />
        <MetricCard detail="Có thể bán" label="Available" tone="muted" value={available} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
          <div className="grid grid-cols-5 gap-3 border-b border-[color:var(--border-soft)] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--muted)]">
            <span>Warehouse</span>
            <span>Quantity</span>
            <span>Reserved</span>
            <span>Available</span>
            <span>Updated</span>
          </div>
          {inventory.map((item) => (
            <div className="grid grid-cols-5 gap-3 border-b border-[color:var(--border-soft)] px-5 py-4 text-sm last:border-0" key={item.id}>
              <span className="font-bold text-[color:var(--primary)]">{warehouses.find((w) => w.id === item.warehouseId)?.name ?? item.warehouseId}</span>
              <span>{item.quantity}</span>
              <span>{item.reservedQuantity}</span>
              <span>{item.availableQuantity}</span>
              <span className="text-xs text-[color:var(--muted)]">{new Date(item.updatedAt).toLocaleString("vi-VN")}</span>
            </div>
          ))}
          {inventory.length === 0 ? <div className="px-5 py-12 text-center text-sm font-semibold text-[color:var(--muted)]">Chưa có bản ghi tồn kho.</div> : null}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
          <h2 className="text-lg font-extrabold text-[color:var(--primary)]">Điều chỉnh tồn kho</h2>
          <FieldShell className="mt-4" label="Warehouse">
            <select className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => setWarehouseId(e.target.value)} value={warehouseId}>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
          </FieldShell>
          <FieldShell className="mt-4" label="Số lượng điều chỉnh">
            <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => setQuantity(Number(e.target.value))} type="number" value={quantity} />
          </FieldShell>
          <FieldShell className="mt-4" label="Lý do">
            <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => setReason(e.target.value)} value={reason} />
          </FieldShell>
          <Button className="mt-5 w-full" disabled={!warehouseId || isPending} onClick={submit}>
            <Save size={18} />
            {isPending ? "Đang lưu..." : "Lưu vào OMS"}
          </Button>
          {message ? <p className="mt-4 text-sm font-bold text-[color:var(--secondary)]">{message}</p> : null}
        </section>
      </div>
    </div>
  );
}
