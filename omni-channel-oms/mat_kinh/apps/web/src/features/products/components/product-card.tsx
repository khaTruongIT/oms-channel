import Link from "next/link";
import type { Product } from "@optiqis/shared";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { cn } from "@optiqis/ui";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  compact = false,
  className,
}: ProductCardProps) {
  const transmission =
    product.slug === "digital-shield-pro"
      ? "T: 99.6%"
      : product.specsJson.uvProtection;
  const series = getSeriesLabel(product.slug);
  const primaryTech = product.technologies[0] ?? product.line;

  return (
    <article
      className={cn(
        "group flex min-h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-editorial)] ring-1 ring-[color:var(--border-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-float)]",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-b from-[color:var(--surface-container-high)]/50 to-white p-5",
          compact ? "h-48" : "h-64",
        )}
      >
        <div className="relative z-10 flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.07em] text-[color:var(--secondary)] backdrop-blur">
            <ShieldCheck size={13} />
            {primaryTech}
          </span>
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-[color:var(--outline)] backdrop-blur">
            {series}
          </span>
        </div>
        <img
          alt={`${product.name} optical lens visual`}
          className="absolute inset-0 h-full w-full object-cover opacity-95 transition duration-500 group-hover:scale-105"
          src={product.heroImage}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/34 to-transparent" />
        <div className="absolute inset-x-5 bottom-5 z-10 flex items-center justify-between gap-3 text-[0.68rem] font-extrabold uppercase tracking-[0.07em]">
          <span className="inline-flex items-center gap-1 rounded bg-white/92 px-2.5 py-1 text-[color:var(--muted)] backdrop-blur">
            <span className="size-1.5 rounded-full bg-[color:var(--secondary)]" />
            {product.line}
          </span>
          <span className="rounded bg-white/92 px-2.5 py-1 text-[color:var(--primary)] backdrop-blur">
            {transmission}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-[color:var(--outline)]">
          OPTIQIS {product.line}
        </div>
        <h3 className="mt-2 text-xl font-extrabold leading-snug text-[color:var(--primary)]">
          {product.name}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-[color:var(--muted)]">
          {product.summary}
        </p>
        <div className="mt-5 rounded-xl bg-[color:var(--surface-soft)] p-3 text-sm">
          <SpecRow label="Chiết suất" value={product.indexes.join(" · ")} />
          <SpecRow label="Lớp phủ" value={product.coatings[0] ?? "Nano-AR"} />
          <SpecRow label="Công nghệ" value={primaryTech} />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Link
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(29,143,209,0.22)] bg-[linear-gradient(180deg,#f3fbff,#e7f5fc)] px-4 py-3 text-sm font-extrabold text-[color:var(--primary)] shadow-[0_8px_20px_-14px_rgba(8,74,120,0.36)] transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(29,143,209,0.38)] hover:bg-white hover:shadow-[0_12px_26px_-16px_rgba(8,74,120,0.45)] active:translate-y-0"
            href={`/san-pham/${product.slug}`}
          >
            Tìm hiểu chi tiết
            <ArrowRight size={16} />
          </Link>
          <Link
            aria-label={`Tìm điểm đo khám cho ${product.name}`}
            className="grid size-11 place-items-center rounded-xl border border-[rgba(29,143,209,0.18)] bg-white text-[color:var(--secondary)] shadow-[0_8px_18px_-16px_rgba(8,74,120,0.36)] transition duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--ice)] hover:text-[color:var(--primary)]"
            href="/tim-diem-ban"
          >
            <MapPin size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function getSeriesLabel(slug: string): string {
  const seriesBySlug: Record<string, string> = {
    "digital-shield-pro": "SERIES 01",
    "chroma-active": "SERIES 02",
    "vista-free-ultra": "SERIES 03",
    "ultra-thin-174": "SERIES 04",
    "drive-clear-night-day": "SERIES 05",
    "junior-care-myopia": "SERIES 06",
  };

  return seriesBySlug[slug] ?? "SERIES";
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="shrink-0 text-[0.72rem] font-extrabold uppercase tracking-[0.05em] text-[color:var(--outline)]">
        {label}
      </span>
      <span className="text-right font-bold text-[color:var(--primary)]">
        {value}
      </span>
    </div>
  );
}
