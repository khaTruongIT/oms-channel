"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { Clinic, User } from "@optiqis/shared";
import { Eye, Hospital, MapPin, PlusCircle, Search, Settings2, Trash2 } from "lucide-react";
import { deleteClinicAction } from "@/app/admin/clinics/actions";
import { MetricCard } from "@/components/ui/primitives";

export function ClinicsTable({ clinics, user }: { clinics: Clinic[]; user: User | null }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const canWrite = user?.role === "ADMIN" || user?.role === "EDITOR";
  const canDelete = user?.role === "ADMIN";

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return clinics;
    return clinics.filter((clinic) =>
      [clinic.name, clinic.province, clinic.district, clinic.address, clinic.hotline, ...clinic.services]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [clinics, query]);

  function removeClinic(id: string): void {
    startTransition(async () => {
      try {
        await deleteClinicAction(id);
        setMessage("Đã xoá phòng khám khỏi CMS.");
      } catch (error: unknown) {
        setMessage(error instanceof Error ? error.message : "Không thể xoá phòng khám.");
      }
    });
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
            <Hospital size={15} />
            O2O clinic network
          </div>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[color:var(--primary)]">
            Quản lý phòng khám & điểm đo mắt
          </h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            Cập nhật địa điểm, hotline, giờ mở cửa và dịch vụ để trang O2O luôn đúng dữ liệu vận hành.
          </p>
        </div>
        {canWrite ? (
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--primary)] px-5 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-glass)]"
            href="/admin/clinics/new"
          >
            <PlusCircle size={18} />
            Thêm phòng khám
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Đang hiển thị trong locator public" label="Phòng khám" value={clinics.length} />
        <MetricCard detail="Khu vực tỉnh/thành đang phục vụ" label="Tỉnh/thành" value={new Set(clinics.map((c) => c.province)).size} />
        <MetricCard detail="Quận/huyện có điểm đo mắt" label="Quận/huyện" tone="muted" value={new Set(clinics.map((c) => c.district)).size} />
        <MetricCard detail="Dịch vụ được công bố" label="Dịch vụ" tone="amber" value={new Set(clinics.flatMap((c) => c.services)).size} />
      </div>

      <div className="mt-8 rounded-2xl bg-white p-4 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
        <div className="flex min-h-12 items-center gap-3 rounded-xl bg-[color:var(--surface-soft)] px-4">
          <Search size={18} className="text-[color:var(--secondary)]" />
          <input
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[color:var(--outline)]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên, tỉnh/thành, quận/huyện, dịch vụ..."
            value={query}
          />
        </div>
        {message ? <p className="mt-3 text-sm font-bold text-[color:var(--secondary)]">{message}</p> : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
        <div className="grid grid-cols-[1.4fr_0.9fr_0.8fr_1fr] gap-4 border-b border-[color:var(--border-soft)] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--muted)]">
          <span>Phòng khám</span>
          <span>Khu vực</span>
          <span>Hotline</span>
          <span className="text-right">Thao tác</span>
        </div>
        {filtered.map((clinic) => (
          <div
            className="grid grid-cols-[1.4fr_0.9fr_0.8fr_1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-5 py-4 last:border-0"
            key={clinic.id}
          >
            <div>
              <div className="font-extrabold text-[color:var(--primary)]">{clinic.name}</div>
              <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[color:var(--muted)]">
                <MapPin className="mt-0.5 shrink-0 text-[color:var(--secondary)]" size={15} />
                {clinic.address}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-[color:var(--outline)]">
                {clinic.services.join(" · ") || "Chưa có dịch vụ"}
              </p>
            </div>
            <span className="text-sm font-bold text-[color:var(--primary)]">
              {clinic.province}
              <span className="mt-1 block text-xs text-[color:var(--muted)]">{clinic.district}</span>
            </span>
            <span className="text-sm font-semibold text-[color:var(--muted)]">
              {clinic.hotline}
              <span className="mt-1 block text-xs">{clinic.hours}</span>
            </span>
            <div className="flex justify-end gap-2">
              <Link className="rounded-lg bg-[color:var(--ice)] p-2 text-[color:var(--primary)]" href="/tim-diem-ban" target="_blank">
                <Eye size={16} />
              </Link>
              {canWrite ? (
                <Link className="rounded-lg bg-[color:var(--surface-soft)] p-2 text-[color:var(--primary)]" href={`/admin/clinics/${clinic.id}/edit`}>
                  <Settings2 size={16} />
                </Link>
              ) : null}
              {canDelete ? (
                <button
                  className="rounded-lg bg-red-50 p-2 text-red-600 disabled:opacity-50"
                  disabled={isPending}
                  onClick={() => removeClinic(clinic.id)}
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
            Không tìm thấy phòng khám phù hợp.
          </div>
        ) : null}
      </div>
    </div>
  );
}
