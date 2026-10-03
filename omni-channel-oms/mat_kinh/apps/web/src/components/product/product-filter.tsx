"use client";

import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import type { Product } from "@optiqis/shared";
import { filterProducts } from "@optiqis/shared";
import {
  Search,
  Settings2,
  Shield,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { ProductCard } from "@/features/products/components/product-card";

const needs = [
  { value: "screen", label: "Màn hình số" },
  { value: "presbyopia", label: "Thị lực 40+" },
  { value: "children", label: "Trẻ em cận thị" },
  { value: "driving", label: "Lái xe đêm" },
  { value: "high-myopia", label: "Cận cao" },
];

const indexes = ["1.56", "1.60", "1.67", "1.74"];
const coatings = ["Nano", "Hydrophobic", "Free-Form", "Diamond", "UV400"];

export function ProductFilter({ products }: { products: Product[] }) {
  const searchId = useId();
  const [need, setNeed] = useState("");
  const [index, setIndex] = useState("");
  const [coating, setCoating] = useState("");
  const [query, setQuery] = useState("");

  const activeFilters = [
    query ? { label: `Tìm: ${query}`, clear: () => setQuery("") } : null,
    need
      ? {
          label: needs.find((item) => item.value === need)?.label ?? need,
          clear: () => setNeed(""),
        }
      : null,
    index ? { label: `n=${index}`, clear: () => setIndex("") } : null,
    coating ? { label: coating, clear: () => setCoating("") } : null,
  ].filter((filter): filter is { label: string; clear: () => void } =>
    Boolean(filter),
  );

  const filtered = useMemo(() => {
    const filteredByFacet = filterProducts(products, { need, index, coating });
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return filteredByFacet;
    }

    return filteredByFacet.filter((product) =>
      `${product.name} ${product.line} ${product.summary} ${product.technologies.join(" ")}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [coating, index, need, products, query]);
  const [featured, ...rest] = filtered;

  return (
    <section className="py-12" id="solutions">
      <div className="sticky top-[105px] z-30 border-y border-[color:var(--surface-container)] bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="content-shell py-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr]">
            <div>
              <label
                className="metric-label mb-1 block text-[color:var(--muted)]"
                htmlFor={searchId}
              >
                Tìm dòng tròng kính
              </label>
              <div className="flex min-h-12 items-center gap-2 rounded-xl bg-[color:var(--surface-soft)] px-3">
                <Search
                  className="shrink-0 text-[color:var(--secondary)]"
                  size={18}
                />
                <input
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[color:var(--outline)]"
                  id={searchId}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Digital Shield, Free-Form..."
                  value={query}
                />
                <kbd className="hidden rounded bg-white px-1.5 py-0.5 text-[0.62rem] font-extrabold text-[color:var(--outline)] xl:inline-block">
                  ⌘K
                </kbd>
              </div>
            </div>
            <FilterSelect
              icon={<SlidersHorizontal size={16} />}
              label="Nhu cầu thị giác"
              onChange={setNeed}
              options={needs}
              value={need}
            />
            <FilterSelect
              icon={<Settings2 size={16} />}
              label="Chiết suất vật liệu"
              onChange={setIndex}
              options={indexes.map((item) => ({ label: item, value: item }))}
              value={index}
            />
            <FilterSelect
              icon={<Shield size={16} />}
              label="Lớp phủ / Công nghệ"
              onChange={setCoating}
              options={coatings.map((item) => ({ label: item, value: item }))}
              value={coating}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-sm font-bold text-[color:var(--primary)]">
              <SlidersHorizontal size={16} />
              {filtered.length} giải pháp phù hợp
            </div>
            {activeFilters.length > 0 ? (
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <button
                    className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[color:var(--primary)] px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-[color:var(--primary-container)]"
                    key={filter.label}
                    onClick={filter.clear}
                    type="button"
                  >
                    {filter.label}
                    <X size={14} />
                  </button>
                ))}
              </div>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-[color:var(--secondary)] hover:bg-[color:var(--ice)]"
              onClick={() => {
                setNeed("");
                setIndex("");
                setCoating("");
                setQuery("");
              }}
              type="button"
            >
              <Sparkles size={16} />
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>
      <div className="content-shell mt-10">
        <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <div className="metric-label text-[color:var(--secondary)]">
              Danh mục tròng kỹ thuật số đặc biệt
            </div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[color:var(--primary)]">
              Dải giải pháp thấu kính chuẩn y khoa
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-[color:var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[color:var(--primary)]" />
              Thử nghiệm lâm sàng
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[color:var(--secondary-container)]" />
              Chuẩn quang sai Abbe cao
            </span>
          </div>
        </div>
        {filtered.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {featured ? (
              <ProductCard
                className={filtered.length > 1 ? "xl:col-span-2" : undefined}
                key={featured.id}
                product={featured}
              />
            ) : null}
            {rest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </div>
      {filtered.length === 0 ? (
        <div className="content-shell mt-8 rounded-2xl bg-white p-8 text-center shadow-[var(--shadow-glass)]">
          <h3 className="text-xl font-extrabold text-[color:var(--primary)]">
            Không tìm thấy giải pháp phù hợp
          </h3>
          <p className="mt-2 text-[color:var(--muted)]">
            Hãy thử bỏ bớt bộ lọc hoặc tìm theo tên dòng tròng kính khác.
          </p>
        </div>
      ) : null}
    </section>
  );
}

interface FilterSelectProps {
  icon: ReactNode;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

function FilterSelect({
  icon,
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  const id = useId();

  return (
    <div>
      <label
        className="metric-label mb-1 block text-[color:var(--muted)]"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="flex min-h-12 items-center gap-2 rounded-xl bg-[color:var(--surface-soft)] px-3 text-[color:var(--primary)] transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[rgba(29,143,209,0.24)]">
        <span className="shrink-0 text-[color:var(--secondary)]">{icon}</span>
        <select
          className="min-h-11 w-full bg-transparent text-sm font-bold outline-none"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          <option value="">Tất cả</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
