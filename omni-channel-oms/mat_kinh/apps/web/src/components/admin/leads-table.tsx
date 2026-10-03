"use client";

import { useMemo, useState, useTransition } from "react";
import type { ConsultationLead, LeadStatus } from "@optiqis/shared";
import { leadStatuses } from "@optiqis/shared";
import { CalendarCheck2, PhoneCall, Search, UserRoundCheck } from "lucide-react";
import { updateLeadStatusAction } from "@/app/admin/leads/actions";
import { MetricCard } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";

const statusLabels: Record<LeadStatus, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  BOOKED: "Đã đặt lịch",
  CLOSED: "Đã đóng",
  SPAM: "Spam",
};

export function LeadsTable({ leads }: { leads: ConsultationLead[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = !statusFilter || lead.status === statusFilter;
      const haystack = [
        lead.fullName,
        lead.phone,
        lead.email,
        lead.province,
        lead.district,
        lead.productName,
        lead.note,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [leads, query, statusFilter]);

  function changeStatus(id: string, status: LeadStatus): void {
    startTransition(async () => {
      try {
        await updateLeadStatusAction(id, status);
        setMessage("Đã cập nhật trạng thái lead.");
      } catch (error: unknown) {
        setMessage(error instanceof Error ? error.message : "Không thể cập nhật lead.");
      }
    });
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
            <UserRoundCheck size={15} />
            Consultation pipeline
          </div>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[color:var(--primary)]">
            Quản lý lead tư vấn O2O
          </h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            Theo dõi người dùng đã để lại thông tin tư vấn, đổi trạng thái sau khi liên hệ và chuẩn bị cho bước booking/orders.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Lead mới cần gọi lại" label="Mới" value={leads.filter((lead) => lead.status === "NEW").length} />
        <MetricCard detail="Đã có nhân sự liên hệ" label="Đã liên hệ" value={leads.filter((lead) => lead.status === "CONTACTED").length} />
        <MetricCard detail="Có lịch hẹn/đo mắt" label="Đã đặt lịch" tone="amber" value={leads.filter((lead) => lead.status === "BOOKED").length} />
        <MetricCard detail="Tổng số lead đang lưu" label="Tổng lead" tone="muted" value={leads.length} />
      </div>

      <div className="mt-8 rounded-2xl bg-white p-4 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="flex min-h-12 items-center gap-3 rounded-xl bg-[color:var(--surface-soft)] px-4">
            <Search size={18} className="text-[color:var(--secondary)]" />
            <input
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[color:var(--outline)]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, số điện thoại, sản phẩm, ghi chú..."
              value={query}
            />
          </div>
          <select
            className="min-h-12 rounded-xl bg-[color:var(--surface-soft)] px-3 text-sm font-bold text-[color:var(--primary)] outline-none"
            onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "")}
            value={statusFilter}
          >
            <option value="">Tất cả trạng thái</option>
            {leadStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>
        {message ? <p className="mt-3 text-sm font-bold text-[color:var(--secondary)]">{message}</p> : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
        <div className="grid grid-cols-[1.15fr_1fr_0.8fr_0.8fr] gap-4 border-b border-[color:var(--border-soft)] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--muted)]">
          <span>Khách hàng</span>
          <span>Nhu cầu</span>
          <span>Thời gian</span>
          <span className="text-right">Trạng thái</span>
        </div>
        {filtered.map((lead) => (
          <div
            className="grid grid-cols-[1.15fr_1fr_0.8fr_0.8fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-5 py-4 last:border-0"
            key={lead.id}
          >
            <div>
              <div className="font-extrabold text-[color:var(--primary)]">{lead.fullName}</div>
              <p className="mt-2 flex items-center gap-2 text-sm font-bold text-[color:var(--muted)]">
                <PhoneCall className="text-[color:var(--secondary)]" size={15} />
                {lead.phone}
              </p>
              {lead.email ? <p className="mt-1 text-xs font-semibold text-[color:var(--outline)]">{lead.email}</p> : null}
            </div>
            <div>
              <div className="text-sm font-bold text-[color:var(--primary)]">{lead.productName ?? "Tư vấn chung"}</div>
              <p className="mt-1 text-xs font-semibold text-[color:var(--muted)]">
                {[lead.province, lead.district].filter(Boolean).join(" · ") || "Chưa chọn khu vực"}
              </p>
              {lead.note ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-[color:var(--muted)]">{lead.note}</p> : null}
            </div>
            <div className="text-sm font-semibold text-[color:var(--muted)]">
              <span className="flex items-center gap-2">
                <CalendarCheck2 size={15} className="text-[color:var(--secondary)]" />
                {formatDate(lead.createdAt)}
              </span>
              <span className="mt-1 block text-xs">{lead.preferredTime ?? "Chưa chọn"}</span>
            </div>
            <div className="flex justify-end">
              <select
                className="min-h-10 rounded-xl bg-[color:var(--surface-soft)] px-3 text-xs font-extrabold text-[color:var(--primary)] outline-none disabled:opacity-60"
                disabled={isPending}
                onChange={(event) => changeStatus(lead.id, event.target.value as LeadStatus)}
                value={lead.status}
              >
                {leadStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm font-semibold text-[color:var(--muted)]">
            Chưa có lead phù hợp bộ lọc.
          </div>
        ) : null}
      </div>
    </div>
  );
}
