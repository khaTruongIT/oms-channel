"use client";

import { useMemo, useState } from "react";
import type { Clinic } from "@optiqis/shared";
import { filterClinics } from "@optiqis/shared";
import {
  Building2,
  Clock3,
  Crosshair,
  MapPin,
  Navigation,
  Phone,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@optiqis/ui";
import { Button, FieldShell } from "@/components/ui/primitives";
import { getUniqueValues } from "@/lib/format";

interface ClinicLocatorProps {
  clinics: Clinic[];
}

interface ClinicCardProps {
  clinic: Clinic;
  isActive: boolean;
  onSelect: (clinic: Clinic) => void;
}

export function ClinicLocator({ clinics }: ClinicLocatorProps) {
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(clinics[0]?.id ?? "");

  const provinces = getUniqueValues(clinics, (clinic) => clinic.province);
  const districts = getUniqueValues(
    province
      ? clinics.filter((clinic) => clinic.province === province)
      : clinics,
    (clinic) => clinic.district,
  );

  const filtered = useMemo(
    () => filterClinics(clinics, { province, district, query }),
    [clinics, district, province, query],
  );

  const selectedClinic =
    filtered.find((clinic) => clinic.id === selectedId) ?? filtered[0] ?? null;

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setDistrict("");
    setSelectedId("");
  };

  const resetFilters = () => {
    setProvince("");
    setDistrict("");
    setQuery("");
    setSelectedId(clinics[0]?.id ?? "");
  };

  return (
    <section className="content-shell section-y">
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <div className="optical-surface p-4 shadow-[var(--shadow-glass)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <FieldShell
                className="md:flex-[1.2]"
                icon={<Search size={17} />}
                label="Tìm kiếm"
              >
                <input
                  className="h-11 w-full bg-transparent text-sm font-semibold text-[color:var(--primary)] outline-none placeholder:text-[color:var(--muted)]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tên điểm bán, địa chỉ, dịch vụ..."
                  value={query}
                />
              </FieldShell>
              <FieldShell icon={<MapPin size={17} />} label="Tỉnh / thành">
                <select
                  className="h-11 w-full bg-transparent text-sm font-semibold text-[color:var(--primary)] outline-none"
                  onChange={(event) => handleProvinceChange(event.target.value)}
                  value={province}
                >
                  <option value="">Tất cả tỉnh/thành</option>
                  {provinces.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell
                icon={<SlidersHorizontal size={17} />}
                label="Quận / huyện"
              >
                <select
                  className="h-11 w-full bg-transparent text-sm font-semibold text-[color:var(--primary)] outline-none"
                  onChange={(event) => {
                    setDistrict(event.target.value);
                    setSelectedId("");
                  }}
                  value={district}
                >
                  <option value="">Tất cả quận/huyện</option>
                  {districts.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </FieldShell>
              <Button onClick={resetFilters} tone="ghost">
                Đặt lại
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[color:var(--muted)]">
              <span className="rounded-full bg-[color:var(--ice)] px-3 py-1 text-[color:var(--primary)]">
                {filtered.length} địa điểm
              </span>
              <span>Đo mắt 12 bước</span>
              <span>Tư vấn tròng kính</span>
              <span>Bảo hành phủ váng</span>
            </div>
          </div>

          <div className="max-h-[760px] space-y-3 overflow-y-auto pr-1">
            {filtered.length > 0 ? (
              filtered.map((clinic) => (
                <ClinicCard
                  clinic={clinic}
                  isActive={clinic.id === selectedClinic?.id}
                  key={clinic.id}
                  onSelect={(nextClinic) => setSelectedId(nextClinic.id)}
                />
              ))
            ) : (
              <div className="optical-surface-soft p-8 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-white text-[color:var(--secondary)] shadow-sm">
                  <Search size={22} />
                </div>
                <h2 className="mt-4 text-xl font-black text-[color:var(--primary)]">
                  Chưa tìm thấy điểm phù hợp
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  Thử bỏ bớt bộ lọc hoặc tìm theo tên tỉnh, địa chỉ, dịch vụ đo
                  mắt.
                </p>
              </div>
            )}
          </div>
        </div>

        <MapPreview clinic={selectedClinic} />
      </div>
    </section>
  );
}

function ClinicCard({ clinic, isActive, onSelect }: ClinicCardProps) {
  return (
    <button
      className={cn(
        "w-full rounded-[8px] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]",
        isActive
          ? "border-[color:var(--secondary)] ring-2 ring-[color:var(--secondary)]/15"
          : "border-[color:var(--border)]",
      )}
      onClick={() => onSelect(clinic)}
      type="button"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-[8px] bg-[color:var(--ice)] text-[color:var(--secondary)]">
          <Building2 size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[color:var(--primary)]">
              {clinic.name}
            </h2>
            <span className="rounded-full bg-[color:var(--surface-soft)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[color:var(--secondary)]">
              {clinic.province}
            </span>
          </div>
          <p className="mt-3 flex gap-2 text-sm leading-6 text-[color:var(--muted)]">
            <MapPin className="mt-1 shrink-0" size={16} />
            <span>
              {clinic.address}, {clinic.district}
            </span>
          </p>
          <div className="mt-3 grid gap-2 text-sm font-bold text-[color:var(--primary)] sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <Phone size={16} />
              {clinic.hotline}
            </span>
            <span className="flex items-center gap-2">
              <Clock3 size={16} />
              {clinic.hours}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {clinic.services.map((service) => (
              <span
                className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-bold text-[color:var(--muted)]"
                key={service}
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

function MapPreview({ clinic }: { clinic: Clinic | null }) {
  return (
    <aside className="sticky top-24 h-fit overflow-hidden rounded-[8px] border border-[color:var(--border)] bg-[color:var(--primary)] text-white shadow-[var(--shadow-float)]">
      <div className="relative min-h-[620px] p-6">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute left-8 top-10 h-px w-[86%] rotate-[-8deg] bg-white/50" />
          <div className="absolute left-14 top-48 h-px w-[82%] rotate-[14deg] bg-white/35" />
          <div className="absolute bottom-28 left-6 h-px w-[92%] rotate-[-16deg] bg-white/30" />
          <div className="absolute left-1/3 top-0 h-full w-px rotate-[12deg] bg-white/25" />
          <div className="absolute right-1/4 top-0 h-full w-px rotate-[-10deg] bg-white/20" />
        </div>

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
              O2O locator
            </p>
            <h2 className="mt-3 max-w-sm text-3xl font-black tracking-tight">
              Bản đồ điểm đo mắt và tư vấn tròng kính OPTIQIS
            </h2>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/10 text-cyan-100 backdrop-blur">
            <Crosshair size={22} />
          </span>
        </div>

        <div className="absolute left-[16%] top-[38%] z-10 grid size-10 place-items-center rounded-full bg-white text-[color:var(--secondary)] shadow-2xl">
          <MapPin size={20} fill="currentColor" />
        </div>
        <div className="absolute right-[20%] top-[28%] z-10 grid size-8 place-items-center rounded-full bg-cyan-100 text-[color:var(--primary)] shadow-xl">
          <MapPin size={16} fill="currentColor" />
        </div>
        <div className="absolute bottom-[32%] right-[34%] z-10 grid size-9 place-items-center rounded-full bg-white/80 text-[color:var(--secondary)] shadow-xl">
          <MapPin size={18} fill="currentColor" />
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-10 rounded-[8px] border border-white/15 bg-white/95 p-5 text-[color:var(--primary)] shadow-2xl">
          {clinic ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--secondary)]">
                    Đang chọn
                  </p>
                  <h3 className="mt-2 text-2xl font-black">{clinic.name}</h3>
                </div>
                <Navigation
                  className="text-[color:var(--secondary)]"
                  size={24}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                {clinic.address}, {clinic.district}, {clinic.province}
              </p>
              <div className="mt-4 grid gap-3 text-sm font-bold sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <Phone size={16} />
                  {clinic.hotline}
                </span>
                <span className="flex items-center gap-2">
                  <Clock3 size={16} />
                  {clinic.hours}
                </span>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-black">Chọn một điểm bán</h3>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                Danh sách bên trái sẽ hiển thị thông tin chi tiết tại đây.
              </p>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
