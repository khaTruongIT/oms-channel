"use client";

import { useState, useTransition } from "react";
import type { ConsultationLead } from "@optiqis/shared";
import { CalendarDays, Send, ShieldCheck } from "lucide-react";
import { submitConsultationLeadAction } from "@/app/leads/actions";
import { Button, FieldShell } from "@/components/ui/primitives";

interface ConsultationLeadFormProps {
  source: ConsultationLead["source"];
  productId?: string;
  productName?: string;
  clinicId?: string;
  compact?: boolean;
}

interface LeadDraft {
  fullName: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  preferredTime: string;
  note: string;
}

const initialDraft: LeadDraft = {
  fullName: "",
  phone: "",
  email: "",
  province: "",
  district: "",
  preferredTime: "",
  note: "",
};

export function ConsultationLeadForm({
  source,
  productId,
  productName,
  clinicId,
  compact = false,
}: ConsultationLeadFormProps) {
  const [draft, setDraft] = useState<LeadDraft>(initialDraft);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function patch<K extends keyof LeadDraft>(key: K, value: LeadDraft[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(): void {
    setMessage("");
    startTransition(async () => {
      try {
        await submitConsultationLeadAction({
          fullName: draft.fullName,
          phone: draft.phone,
          email: emptyToUndefined(draft.email),
          province: emptyToUndefined(draft.province),
          district: emptyToUndefined(draft.district),
          productId,
          productName,
          clinicId,
          preferredTime: emptyToUndefined(draft.preferredTime),
          note: emptyToUndefined(draft.note),
          source,
        });
        setDraft(initialDraft);
        setMessage("Đã nhận thông tin. OPTIQIS/đối tác sẽ liên hệ tư vấn trong thời gian gần nhất.");
      } catch {
        setMessage("Chưa thể gửi thông tin. Vui lòng kiểm tra số điện thoại hoặc thử lại sau.");
      }
    });
  }

  return (
    <section
      className={`rounded-3xl bg-white shadow-[var(--shadow-float)] ring-1 ring-[color:var(--border-soft)] ${
        compact ? "p-5" : "p-6 md:p-7"
      }`}
      id="consultation"
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
        <CalendarDays size={15} />
        O2O consultation
      </div>
      <h2 className="mt-4 text-2xl font-extrabold leading-tight text-[color:var(--primary)]">
        Đăng ký tư vấn đo mắt
      </h2>
      <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
        Form này không thay thế khám mắt. Thông tin sẽ được chuyển cho đội ngũ tư vấn/điểm đo phù hợp.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <FieldShell label="Họ và tên">
          <input
            className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none"
            onChange={(event) => patch("fullName", event.target.value)}
            placeholder="Nguyen Minh Anh"
            value={draft.fullName}
          />
        </FieldShell>
        <FieldShell label="Số điện thoại">
          <input
            className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none"
            onChange={(event) => patch("phone", event.target.value)}
            placeholder="0901234567"
            value={draft.phone}
          />
        </FieldShell>
        <FieldShell label="Email" hint="không bắt buộc">
          <input
            className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none"
            onChange={(event) => patch("email", event.target.value)}
            placeholder="email@example.com"
            type="email"
            value={draft.email}
          />
        </FieldShell>
        <FieldShell label="Thời gian mong muốn" hint="không bắt buộc">
          <input
            className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none"
            onChange={(event) => patch("preferredTime", event.target.value)}
            placeholder="Cuối tuần / Sau 18h"
            value={draft.preferredTime}
          />
        </FieldShell>
        <FieldShell label="Tỉnh/thành" hint="không bắt buộc">
          <input
            className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none"
            onChange={(event) => patch("province", event.target.value)}
            placeholder="TP. Hồ Chí Minh"
            value={draft.province}
          />
        </FieldShell>
        <FieldShell label="Quận/huyện" hint="không bắt buộc">
          <input
            className="min-h-12 w-full rounded-xl border border-[color:var(--border-soft)] px-3 font-semibold outline-none"
            onChange={(event) => patch("district", event.target.value)}
            placeholder="Quận 1"
            value={draft.district}
          />
        </FieldShell>
      </div>

      <FieldShell className="mt-4" label="Ghi chú" hint="không bắt buộc">
        <textarea
          className="min-h-24 w-full rounded-xl border border-[color:var(--border-soft)] p-3 font-semibold outline-none"
          onChange={(event) => patch("note", event.target.value)}
          placeholder="Nhu cầu, độ kính hiện tại, triệu chứng mỏi mắt..."
          value={draft.note}
        />
      </FieldShell>

      {message ? (
        <p className="mt-4 rounded-xl bg-[color:var(--ice)] px-4 py-3 text-sm font-bold leading-6 text-[color:var(--primary)]">
          {message}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs font-bold leading-5 text-[color:var(--muted)]">
          <ShieldCheck className="shrink-0 text-[color:var(--secondary)]" size={16} />
          Chỉ dùng cho mục đích tư vấn O2O, không hiển thị công khai.
        </p>
        <Button disabled={isPending || !draft.fullName || !draft.phone} onClick={submit}>
          <Send size={17} />
          {isPending ? "Đang gửi..." : "Gửi thông tin"}
        </Button>
      </div>
    </section>
  );
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
