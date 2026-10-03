import { Activity, AlertTriangle, CheckCircle2, CircleOff } from "lucide-react";
import type { OmsStatus } from "@/lib/api";

const stateStyles = {
  connected: {
    icon: CheckCircle2,
    label: "OMS connected",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  degraded: {
    icon: AlertTriangle,
    label: "OMS degraded",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  disabled: {
    icon: CircleOff,
    label: "OMS disabled",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
} satisfies Record<OmsStatus["state"], { icon: typeof Activity; label: string; className: string }>;

export function OmsStatusBanner({ status }: { status: OmsStatus | null }) {
  if (!status) {
    return (
      <div className="mx-5 mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 lg:mx-8">
        Không thể tải trạng thái OMS. Kiểm tra API CMS hoặc phiên đăng nhập admin.
      </div>
    );
  }

  const style = stateStyles[status.state];
  const Icon = style.icon;
  const checks = Object.entries(status.checks);

  return (
    <section className={`mx-5 mt-5 rounded-2xl border p-4 lg:mx-8 ${style.className}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/70">
            <Icon size={20} />
          </span>
          <div>
            <div className="text-sm font-extrabold uppercase tracking-[0.08em]">{style.label}</div>
            <p className="mt-1 text-sm font-semibold opacity-85">{status.message}</p>
          </div>
        </div>
        <div className="text-xs font-bold opacity-75">
          Checked {new Date(status.checkedAt).toLocaleString("vi-VN")}
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        {checks.map(([name, check]) => (
          <div className="rounded-xl bg-white/70 px-3 py-2" key={name}>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] opacity-70">
              {name}
            </div>
            <div className="mt-1 text-xs font-bold">
              {check.state === "pass" ? "OK" : check.state === "fail" ? "Fail" : "Skipped"}
            </div>
            <p className="mt-1 text-xs font-semibold opacity-75">{check.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
