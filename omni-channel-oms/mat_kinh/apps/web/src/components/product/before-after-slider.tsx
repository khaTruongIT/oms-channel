"use client";

import { useState } from "react";

export function BeforeAfterSlider() {
  const [value, setValue] = useState(52);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="metric-label text-[color:var(--secondary)]">
            True-color comparison
          </div>
          <h2 className="mt-2 text-2xl font-extrabold text-[color:var(--primary)]">
            Trước / sau lớp phủ cân bằng màu
          </h2>
        </div>
        <span className="text-sm font-extrabold text-[color:var(--muted)]">
          {value}% OPTIQIS
        </span>
      </div>
      <div className="relative mt-5 h-72 overflow-hidden rounded-2xl bg-slate-900 md:h-96">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#dce8f4,#ffffff_45%,#7fbef1)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_28%,rgba(255,255,255,0.82),transparent_20%),radial-gradient(circle_at_80%_78%,rgba(22,55,92,0.18),transparent_24%)]" />
        <div
          className="absolute inset-y-0 left-0 overflow-hidden bg-[linear-gradient(135deg,#ffe7a1,#d9ebff_48%,#ffffff)]"
          style={{ width: `${value}%` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_30%,rgba(255,255,255,0.76),transparent_18%),radial-gradient(circle_at_84%_72%,rgba(29,143,209,0.18),transparent_22%)]" />
        </div>
        <div className="absolute inset-x-0 top-6 z-10 grid place-items-center">
          <div className="rounded-full bg-white/88 px-5 py-3 text-sm font-black text-[color:var(--primary)] shadow-xl backdrop-blur">
            Kéo để so sánh màu sắc và độ chói
          </div>
        </div>
        <div
          className="absolute inset-y-0 w-1 bg-white shadow-xl"
          style={{ left: `${value}%` }}
        >
          <div className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs font-black text-[color:var(--primary)] shadow-[var(--shadow-glass)]">
            ↔
          </div>
        </div>
      </div>
      <input
        aria-label="So sanh truoc sau"
        className="mt-5 h-2 w-full accent-[color:var(--primary)]"
        max={85}
        min={15}
        onChange={(event) => setValue(Number(event.target.value))}
        type="range"
        value={value}
      />
      <div className="mt-2 flex justify-between text-xs font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
        <span>Trong thông thường</span>
        <span>OPTIQIS True-Color</span>
      </div>
    </div>
  );
}
