export function SpectrumVisual() {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="metric-label text-[color:var(--secondary)]">
            Selective spectrum
          </div>
          <h2 className="mt-2 text-2xl font-extrabold text-[color:var(--primary)]">
            Lọc quang phổ có chọn lọc
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Mô phỏng vùng HEV cần hạn chế và vùng xanh ngọc có ích cần được giữ
            lại.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-xs font-black text-[color:var(--secondary)]">
          415-495nm
        </span>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-3">
        <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-r from-violet-700 via-blue-500 via-cyan-300 to-emerald-300">
          <div className="absolute inset-y-0 left-0 w-[38%] bg-[color:var(--amber)]/78" />
          <div className="absolute inset-y-0 left-[38%] w-[30%] bg-cyan-200/50" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0)_45%,rgba(0,0,0,0.18))]" />
          <div className="absolute left-[18%] top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-black text-[color:var(--primary)] shadow-[var(--shadow-glass)]">
            HEV 415-455nm
          </div>
          <div className="absolute left-[52%] top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-black text-[color:var(--primary)] shadow-[var(--shadow-glass)]">
            465-495nm retained
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-extrabold uppercase tracking-[0.06em] text-[color:var(--muted)]">
          <span>Violet</span>
          <span className="text-center text-[color:var(--secondary)]">
            True color
          </span>
          <span className="text-right">Green-cyan</span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-2xl bg-[color:var(--ice)] p-4 font-bold leading-6 text-[color:var(--primary)]">
          Giữ cân bằng màu để hạn chế ám vàng quá mức trong trải nghiệm hằng
          ngày.
        </div>
        <div className="rounded-2xl bg-[color:var(--surface-soft)] p-4 font-bold leading-6 text-[color:var(--primary)]">
          Thông số cần được xác minh theo tiêu chuẩn đo truyền quang trước khi
          công bố thương mại.
        </div>
      </div>
    </div>
  );
}
