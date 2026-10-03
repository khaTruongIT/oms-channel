import Link from "next/link";
import {
  Clock3,
  ExternalLink,
  MapPin,
  Microscope,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/primitives";

const navItems = [
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/san-pham#solutions", label: "Giải pháp thị lực" },
  { href: "/san-pham#technology", label: "Công nghệ" },
  { href: "/kien-thuc", label: "Kiến thức về mắt" },
  { href: "/tim-diem-ban", label: "Về O2O" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border-soft)] bg-white/92 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="bg-[color:var(--primary-container)] px-4 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-white">
        <div className="content-shell flex items-center justify-between gap-4">
          <span className="truncate">
            Tiêu chuẩn khúc xạ chuẩn hóa quốc tế ISO 14889 & CE Marking
          </span>
          <div className="hidden shrink-0 items-center gap-5 text-[color:var(--secondary-container)] md:flex">
            <span>Hotline lâm sàng: 1800 6919</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={13} />
              08:00 - 20:30 hằng ngày
            </span>
          </div>
        </div>
      </div>
      <div className="content-shell flex h-20 items-center justify-between gap-4">
        <Link
          aria-label="OPTIQIS Optical Lenswear"
          className="flex items-center gap-3"
          href="/"
        >
          <BrandMark />
          <span>
            <span className="block text-xl font-extrabold text-[color:var(--primary)]">
              OPTIQIS
            </span>
            <span className="block text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[color:var(--secondary)]">
              Optical Lenswear
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => (
            <Link
              className="rounded-full px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.04em] text-[color:var(--muted)] transition hover:bg-[color:var(--surface-container-high)] hover:text-[color:var(--primary)]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            aria-label="Tìm kiếm kiến thức thị giác"
            className="hidden rounded-full p-3 text-[color:var(--muted)] hover:bg-[color:var(--ice)] md:block"
            href="/kien-thuc"
          >
            <Search size={19} />
          </Link>
          <ButtonLink
            className="border border-[rgba(29,143,209,0.24)] bg-[linear-gradient(180deg,#f7fdff,#eaf6fc)] px-4 text-[color:var(--primary)] shadow-[0_10px_24px_-18px_rgba(8,74,120,0.36)] hover:border-[rgba(29,143,209,0.42)] hover:bg-white sm:px-5"
            href="/tim-diem-ban"
          >
            <MapPin size={18} />
            <span className="hidden sm:inline">Tìm điểm bán</span>
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[rgba(29,143,209,0.22)] bg-[linear-gradient(135deg,#ffffff_0%,#eaf6fc_52%,#d0e4ff_100%)] shadow-[0_10px_24px_-18px_rgba(8,74,120,0.42)]"
    >
      <span className="absolute inset-1 rounded-md border border-white/80" />
      <ShieldCheck
        className="relative text-[color:var(--primary)]"
        size={22}
        strokeWidth={2.4}
      />
    </span>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-24 bg-[color:var(--surface-soft)] py-14">
      <div className="content-shell grid gap-10 lg:grid-cols-[1.25fr_1fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3 text-2xl font-extrabold text-[color:var(--primary)]">
            <Microscope size={24} />
            OPTIQIS
          </div>
          <p className="mt-3 max-w-sm text-sm leading-7 text-[color:var(--muted)]">
            Nền tảng giáo dục thị lực và kết nối khám khúc xạ ủy quyền. Không
            bán tròng kính trực tuyến, không thay thế chẩn đoán y khoa.
          </p>
          <div className="mt-5 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
            Medical education demo
          </div>
          <div className="mt-4 flex gap-2">
            <span className="rounded bg-white px-2 py-1 text-[0.66rem] font-extrabold uppercase tracking-[0.08em] text-[color:var(--primary)]">
              FDA
            </span>
            <span className="rounded bg-white px-2 py-1 text-[0.66rem] font-extrabold uppercase tracking-[0.08em] text-[color:var(--primary)]">
              CE Mark
            </span>
          </div>
        </div>
        <FooterColumn
          title="Sản phẩm"
          values={["Digital Shield", "Vista-Free", "Junior Care"]}
        />
        <FooterColumn
          title="Kiến thức"
          values={["Hội chứng CVS", "Chiết suất", "ISO 8980-3"]}
        />
        <FooterColumn
          title="Hỗ trợ"
          values={["Hotline 1800 6919", "450+ đối tác", "Đo mắt 12 bước"]}
        />
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[color:var(--primary)]">
            Điều hướng nhanh
          </h3>
          <Link
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(29,143,209,0.24)] bg-white px-4 py-2 text-sm font-extrabold text-[color:var(--primary)] shadow-[var(--shadow-glass)] transition hover:bg-[color:var(--ice)]"
            href="/tim-diem-ban"
          >
            Tìm điểm bán
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[color:var(--primary)]">
        {title}
      </h3>
      <ul className="mt-4 space-y-3 text-sm text-[color:var(--muted)]">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}
