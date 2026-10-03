"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { Product, User } from "@optiqis/shared";
import { Boxes, Eye, PackagePlus, Search, Settings2, Trash2 } from "lucide-react";
import { deleteProductAction } from "@/app/admin/products/actions";
import { MetricCard } from "@/components/ui/primitives";

function hasMissingStorefrontMetadata(product: Product): boolean {
  return (
    !product.slug ||
    !product.summary ||
    !product.heroImage ||
    product.needs.length === 0 ||
    product.indexes.length === 0 ||
    product.coatings.length === 0 ||
    product.technologies.length === 0
  );
}

export function ProductsTable({ products, user }: { products: Product[]; user: User | null }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const canWrite = user?.role === "ADMIN" || user?.role === "EDITOR";
  const canDelete = user?.role === "ADMIN";
  const missingMetadataCount = products.filter(hasMissingStorefrontMetadata).length;

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return products;
    return products.filter((product) =>
      [product.name, product.slug, product.line, product.summary]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [products, query]);

  function removeProduct(id: string): void {
    startTransition(async () => {
      try {
        await deleteProductAction(id);
        setMessage("Đã xoá sản phẩm khỏi OMS/CMS.");
      } catch (error: unknown) {
        setMessage(error instanceof Error ? error.message : "Không thể xoá sản phẩm.");
      }
    });
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
            <Boxes size={15} />
            OMS product source of truth
          </div>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[color:var(--primary)]">
            Quản lý dòng kính OPTIQIS
          </h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            Danh mục này được lấy qua adapter OMS. Metadata public dùng để render website mắt kính.
          </p>
        </div>
        {canWrite ? (
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--primary)] px-5 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-glass)]"
            href="/admin/products/new"
          >
            <PackagePlus size={18} />
            Thêm dòng kính
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Được đồng bộ qua OMS master_skus" label="Dòng kính" value={products.length} />
        <MetricCard detail="Hiển thị ưu tiên trên website" label="Featured" value={products.filter((p) => p.isFeatured).length} />
        <MetricCard detail="Nhóm nhu cầu thị giác" label="Needs" tone="muted" value={new Set(products.flatMap((p) => p.needs)).size} />
        <MetricCard detail="Thiếu metadata để render public page" label="Missing metadata" tone="amber" value={missingMetadataCount} />
      </div>

      <div className="mt-8 rounded-2xl bg-white p-4 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
        <div className="flex min-h-12 items-center gap-3 rounded-xl bg-[color:var(--surface-soft)] px-4">
          <Search size={18} className="text-[color:var(--secondary)]" />
          <input
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[color:var(--outline)]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên, slug, line..."
            value={query}
          />
        </div>
        {message ? <p className="mt-3 text-sm font-bold text-[color:var(--secondary)]">{message}</p> : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
        <div className="grid grid-cols-[1.6fr_1fr_0.9fr_1fr] gap-4 border-b border-[color:var(--border-soft)] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--muted)]">
          <span>Sản phẩm</span>
          <span>Line</span>
          <span>Chiết suất</span>
          <span className="text-right">Thao tác</span>
        </div>
        {filtered.map((product) => (
          <div
            className="grid grid-cols-[1.6fr_1fr_0.9fr_1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-5 py-4 last:border-0"
            key={product.id}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-extrabold text-[color:var(--primary)]">{product.name}</div>
                {hasMissingStorefrontMetadata(product) ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-amber-700">
                    Missing metadata
                  </span>
                ) : null}
              </div>
              <div className="mt-1 text-xs font-semibold text-[color:var(--muted)]">/{product.slug}</div>
              <p className="mt-2 line-clamp-2 text-sm text-[color:var(--muted)]">{product.summary}</p>
            </div>
            <span className="text-sm font-bold text-[color:var(--primary)]">{product.line}</span>
            <span className="text-sm font-semibold text-[color:var(--muted)]">{product.indexes.join(", ") || "—"}</span>
            <div className="flex justify-end gap-2">
              <Link className="rounded-lg bg-[color:var(--ice)] p-2 text-[color:var(--primary)]" href={`/san-pham/${product.slug}`} target="_blank">
                <Eye size={16} />
              </Link>
              <Link className="rounded-lg bg-[color:var(--surface-soft)] p-2 text-[color:var(--primary)]" href={`/admin/products/${product.id}/inventory`}>
                <Boxes size={16} />
              </Link>
              {canWrite ? (
                <Link className="rounded-lg bg-[color:var(--surface-soft)] p-2 text-[color:var(--primary)]" href={`/admin/products/${product.id}/edit`}>
                  <Settings2 size={16} />
                </Link>
              ) : null}
              {canDelete ? (
                <button
                  className="rounded-lg bg-red-50 p-2 text-red-600 disabled:opacity-50"
                  disabled={isPending}
                  onClick={() => removeProduct(product.id)}
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm font-semibold text-[color:var(--muted)]">
            Không tìm thấy dòng kính phù hợp.
          </div>
        ) : null}
      </div>
    </div>
  );
}
