"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const options = [
  {
    index: "1.56",
    range: "Do nhe den trung binh",
    desc: "Can bang chi phi va do trong, phu hop gong day.",
  },
  {
    index: "1.60",
    range: "Khoang +/-2.00 den +/-4.00D",
    desc: "Ben hon, mong hon, hop voi nguoi dung hang ngay.",
  },
  {
    index: "1.67",
    range: "Khoang +/-4.00 den +/-6.00D",
    desc: "Sieu mong cho nhu cau tham my va can cao.",
  },
  {
    index: "1.74",
    range: "Tren +/-6.00D",
    desc: "Cuc mong, can can bang Abbe va tu van khuc xa ky.",
  },
];

const defaultOption = options[1] ?? options[0]!;

export function IndexSelector() {
  const [selected, setSelected] = useState(defaultOption);

  return (
    <div className="refraction-glow rounded-3xl bg-white p-5 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="metric-label text-[color:var(--secondary)]">
            Dynamic index selector
          </div>
          <h3 className="mt-2 text-2xl font-extrabold text-[color:var(--primary)]">
            Chọn chiết suất theo độ khúc xạ
          </h3>
        </div>
        <span className="w-fit rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--primary)]">
          Demo tư vấn tại quầy
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <button
            aria-pressed={selected.index === option.index}
            className={`relative min-h-32 rounded-2xl border p-4 text-left transition ${
              selected.index === option.index
                ? "border-[color:var(--secondary)] bg-[color:var(--ice)] shadow-[var(--shadow-glass)]"
                : "border-[color:var(--border-soft)] bg-white hover:-translate-y-0.5 hover:border-[color:var(--secondary)]"
            }`}
            key={option.index}
            onClick={() => setSelected(option)}
            type="button"
          >
            {selected.index === option.index ? (
              <CheckCircle2
                className="absolute right-3 top-3 text-[color:var(--secondary)]"
                size={17}
              />
            ) : null}
            <span className="block text-2xl font-black text-[color:var(--primary)]">
              {option.index}
            </span>
            <span className="mt-1 block text-xs font-bold text-[color:var(--muted)]">
              {option.range}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-[color:var(--surface-soft)] p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold leading-6 text-[color:var(--primary)]">
            {selected.desc}
          </p>
          <span className="hidden text-4xl font-extrabold text-[color:var(--secondary)] sm:block">
            {selected.index}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#73d5ff,#16375c)]"
            style={{ width: `${Math.min(100, Number(selected.index) * 50)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
