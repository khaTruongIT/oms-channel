"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Product } from "@optiqis/shared";
import { Save, ShieldCheck } from "lucide-react";
import { createProductAction, updateProductAction } from "@/app/admin/products/actions";
import { Button, FieldShell } from "@/components/ui/primitives";

const defaultSpecs = {
  abbe: "32-42",
  uvProtection: "UV400+",
  recommendedFor: ["Dân văn phòng"],
  wavelength: {
    adverse: "415-455nm",
    beneficial: "465-495nm",
    claim: "Giảm đỉnh HEV có hại",
  },
};

const emptyProduct: Omit<Product, "id"> = {
  slug: "",
  name: "",
  line: "",
  summary: "",
  needs: [],
  indexes: [],
  coatings: [],
  technologies: [],
  heroImage: "",
  specsJson: defaultSpecs,
  isFeatured: false,
};

function csv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function csvText(value: string[]): string {
  return value.join(", ");
}

export function ProductEditor({ product }: { product?: Product | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Omit<Product, "id">>(product ?? emptyProduct);
  const [specsText, setSpecsText] = useState(JSON.stringify((product ?? emptyProduct).specsJson, null, 2));
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(product?.id);

  function patch<K extends keyof Omit<Product, "id">>(key: K, value: Omit<Product, "id">[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save(): void {
    startTransition(async () => {
      try {
        const parsedSpecs = JSON.parse(specsText) as Product["specsJson"];
        const payload = { ...draft, specsJson: parsedSpecs };
        const saved = product?.id
          ? await updateProductAction(product.id, payload)
          : await createProductAction(payload);
        setMessage("Đã lưu dòng kính qua API.");
        router.push(`/admin/products/${saved.id}/edit`);
        router.refresh();
      } catch (error: unknown) {
        setMessage(error instanceof Error ? error.message : "Không thể lưu dòng kính.");
      }
    });
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
            <ShieldCheck size={15} />
            OMS product metadata
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-[color:var(--primary)]">
            {isEditing ? "Chỉnh sửa dòng kính" : "Thêm dòng kính mới"}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Nội dung marketing được lưu vào `publicMetadata` trong OMS master SKU.
          </p>
        </div>
        <Button disabled={isPending} onClick={save}>
          <Save size={18} />
          {isPending ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>

      {message ? <p className="mt-5 rounded-xl bg-[color:var(--ice)] px-4 py-3 text-sm font-bold text-[color:var(--primary)]">{message}</p> : null}

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldShell label="Tên dòng kính">
              <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("name", e.target.value)} value={draft.name} />
            </FieldShell>
            <FieldShell label="Slug / SKU nguồn">
              <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("slug", e.target.value)} value={draft.slug} />
            </FieldShell>
            <FieldShell label="Line">
              <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("line", e.target.value)} value={draft.line} />
            </FieldShell>
            <FieldShell label="Hero image URL">
              <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("heroImage", e.target.value)} value={draft.heroImage} />
            </FieldShell>
          </div>
          <FieldShell className="mt-4" label="Tóm tắt">
            <textarea className="min-h-28 w-full rounded-xl border border-[color:var(--border-soft)] p-3 font-semibold outline-none" onChange={(e) => patch("summary", e.target.value)} value={draft.summary} />
          </FieldShell>
          <label className="mt-4 flex items-center gap-3 text-sm font-bold text-[color:var(--primary)]">
            <input checked={draft.isFeatured} onChange={(e) => patch("isFeatured", e.target.checked)} type="checkbox" />
            Hiển thị featured
          </label>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
          <FieldShell label="Needs" hint="ngăn cách bằng dấu phẩy">
            <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("needs", csv(e.target.value))} value={csvText(draft.needs)} />
          </FieldShell>
          <FieldShell className="mt-4" label="Indexes" hint="ngăn cách bằng dấu phẩy">
            <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("indexes", csv(e.target.value))} value={csvText(draft.indexes)} />
          </FieldShell>
          <FieldShell className="mt-4" label="Coatings" hint="ngăn cách bằng dấu phẩy">
            <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("coatings", csv(e.target.value))} value={csvText(draft.coatings)} />
          </FieldShell>
          <FieldShell className="mt-4" label="Technologies" hint="ngăn cách bằng dấu phẩy">
            <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("technologies", csv(e.target.value))} value={csvText(draft.technologies)} />
          </FieldShell>
        </section>
      </div>

      <section className="mt-5 rounded-2xl bg-white p-5 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
        <FieldShell label="Specs JSON">
          <textarea className="min-h-64 w-full rounded-xl border border-[color:var(--border-soft)] bg-slate-950 p-4 font-mono text-sm text-white outline-none" onChange={(e) => setSpecsText(e.target.value)} value={specsText} />
        </FieldShell>
      </section>
    </div>
  );
}

