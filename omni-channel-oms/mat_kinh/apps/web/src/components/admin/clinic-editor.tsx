"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Clinic } from "@optiqis/shared";
import { Hospital, Save } from "lucide-react";
import { createClinicAction, updateClinicAction } from "@/app/admin/clinics/actions";
import { Button, FieldShell } from "@/components/ui/primitives";

const emptyClinic: Omit<Clinic, "id"> = {
  name: "",
  province: "",
  district: "",
  address: "",
  hotline: "",
  hours: "",
  lat: 10.7758,
  lng: 106.7009,
  services: [],
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

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function ClinicEditor({ clinic }: { clinic?: Clinic | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Omit<Clinic, "id">>(clinic ?? emptyClinic);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(clinic?.id);

  function patch<K extends keyof Omit<Clinic, "id">>(key: K, value: Omit<Clinic, "id">[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save(): void {
    startTransition(async () => {
      try {
        const saved = clinic?.id
          ? await updateClinicAction(clinic.id, draft)
          : await createClinicAction(draft);
        setMessage("Đã lưu phòng khám qua API.");
        router.push(`/admin/clinics/${saved.id}/edit`);
        router.refresh();
      } catch (error: unknown) {
        setMessage(error instanceof Error ? error.message : "Không thể lưu phòng khám.");
      }
    });
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
            <Hospital size={15} />
            Clinic operations
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-[color:var(--primary)]">
            {isEditing ? "Chỉnh sửa phòng khám" : "Thêm phòng khám mới"}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Dữ liệu này dùng cho trang tìm điểm bán/đo mắt và các luồng O2O sau này.
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
            <FieldShell label="Tên phòng khám">
              <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("name", e.target.value)} value={draft.name} />
            </FieldShell>
            <FieldShell label="Hotline">
              <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("hotline", e.target.value)} value={draft.hotline} />
            </FieldShell>
            <FieldShell label="Tỉnh/thành">
              <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("province", e.target.value)} value={draft.province} />
            </FieldShell>
            <FieldShell label="Quận/huyện">
              <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("district", e.target.value)} value={draft.district} />
            </FieldShell>
          </div>
          <FieldShell className="mt-4" label="Địa chỉ">
            <textarea className="min-h-28 w-full rounded-xl border border-[color:var(--border-soft)] p-3 font-semibold outline-none" onChange={(e) => patch("address", e.target.value)} value={draft.address} />
          </FieldShell>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
          <FieldShell label="Giờ mở cửa">
            <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("hours", e.target.value)} value={draft.hours} />
          </FieldShell>
          <FieldShell className="mt-4" label="Dịch vụ" hint="ngăn cách bằng dấu phẩy">
            <input className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none" onChange={(e) => patch("services", csv(e.target.value))} value={csvText(draft.services)} />
          </FieldShell>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FieldShell label="Latitude">
              <input
                className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none"
                onChange={(e) => patch("lat", safeNumber(e.target.valueAsNumber))}
                step="0.000001"
                type="number"
                value={draft.lat}
              />
            </FieldShell>
            <FieldShell label="Longitude">
              <input
                className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none"
                onChange={(e) => patch("lng", safeNumber(e.target.valueAsNumber))}
                step="0.000001"
                type="number"
                value={draft.lng}
              />
            </FieldShell>
          </div>
        </section>
      </div>
    </div>
  );
}
