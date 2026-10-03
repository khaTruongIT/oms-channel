import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Info,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MedicalDisclaimer } from "@/components/brand/medical-disclaimer";
import { PublicFooter, PublicHeader } from "@/components/brand/public-shell";
import { ConsultationLeadForm } from "@/components/leads/consultation-lead-form";
import { BeforeAfterSlider } from "@/components/product/before-after-slider";
import { IndexSelector } from "@/components/product/index-selector";
import { SpectrumVisual } from "@/components/product/spectrum-visual";
import {
  Breadcrumbs,
  ButtonLink,
  SectionHeader,
} from "@/components/ui/primitives";
import { getProduct } from "@/lib/api";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <PublicHeader />
      <main className="pb-24 md:pb-0">
        <Breadcrumbs
          items={[
            { href: "/", label: "Trang chủ" },
            { href: "/san-pham", label: "Sản phẩm" },
            { label: product.name },
          ]}
        />
        <section className="content-shell grid gap-8 py-10 xl:grid-cols-12">
          <div className="space-y-5 xl:col-span-7">
            <div className="refraction-glow relative overflow-hidden rounded-3xl bg-white p-4 shadow-[var(--shadow-float)] ring-1 ring-[color:var(--border-soft)] sm:p-5">
              <div className="absolute left-8 top-8 z-10 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)] backdrop-blur">
                <span className="size-2 rounded-full bg-[color:var(--secondary)]" />
                Lens diameter Ø75mm
              </div>
              <img
                alt={`${product.name} optical lens detail`}
                className="h-[420px] w-full rounded-2xl object-cover sm:h-[560px]"
                src={product.heroImage}
              />
              <div className="absolute bottom-8 left-8 hidden gap-2 rounded-full bg-white/86 p-1.5 shadow-[var(--shadow-glass)] backdrop-blur md:flex">
                {["Trực diện", "Nano coat", "Mặt cắt"].map((mode, index) => (
                  <button
                    className={`rounded-full px-4 py-2 text-xs font-extrabold ${
                      index === 0
                        ? "bg-[color:var(--primary)] text-white"
                        : "text-[color:var(--primary)] hover:bg-[color:var(--ice)]"
                    }`}
                    key={mode}
                    type="button"
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="absolute bottom-8 right-8 max-w-xs rounded-2xl bg-white/90 p-4 shadow-[var(--shadow-glass)] backdrop-blur">
                <div className="flex items-center gap-3">
                  <BadgeCheck
                    className="text-[color:var(--secondary)]"
                    size={24}
                  />
                  <div>
                    <div className="text-sm font-extrabold text-[color:var(--primary)]">
                      Khắc laser chìm OPTIQIS
                    </div>
                    <div className="text-xs font-bold text-[color:var(--muted)]">
                      Demo nhận diện chính hãng
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FeatureGlance
                icon={<ShieldCheck size={20} />}
                label="UV protection"
                value={product.specsJson.uvProtection}
              />
              <FeatureGlance
                icon={<Sparkles size={20} />}
                label="Abbe clarity"
                value={product.specsJson.abbe}
              />
              <FeatureGlance
                icon={<BadgeCheck size={20} />}
                label="Index options"
                value={product.indexes.join(" · ")}
              />
            </div>
          </div>
          <aside className="h-fit rounded-3xl bg-white p-5 shadow-[var(--shadow-float)] ring-1 ring-[color:var(--border-soft)] sm:p-6 xl:sticky xl:top-28 xl:col-span-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="metric-label rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-[color:var(--secondary)]">
                {product.line}
              </span>
              <span className="metric-label rounded-full bg-[color:var(--surface-soft)] px-3 py-1.5 text-[color:var(--primary)]">
                O2O clinic only
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-[color:var(--primary)]">
              {product.name}
            </h1>
            <p className="mt-4 text-base leading-7 text-[color:var(--muted)]">
              {product.summary}
            </p>
            <div className="mt-6 rounded-2xl bg-[color:var(--surface-soft)] p-4">
              <Spec
                label="Bước sóng / claim"
                value={product.specsJson.wavelength.claim}
              />
              <Spec
                label="Dải cần hạn chế"
                value={product.specsJson.wavelength.adverse}
              />
              <Spec
                label="Dải cần giữ lại"
                value={product.specsJson.wavelength.beneficial}
              />
            </div>
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-extrabold text-[color:var(--primary)]">
                  Dải chiết suất
                </div>
                <div className="text-xs font-bold text-[color:var(--muted)]">
                  tư vấn theo độ khúc xạ
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                {product.indexes.map((index) => (
                  <div
                    className="rounded-2xl border border-[color:var(--border-soft)] bg-white px-3 py-3"
                    key={index}
                  >
                    <div className="text-2xl font-extrabold text-[color:var(--primary)]">
                      {index}
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--surface-container-high)]">
                      <div
                        className="h-full rounded-full bg-[color:var(--secondary)]"
                        style={{
                          width: `${Math.min(100, Number(index) * 48)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <div className="mb-2 text-sm font-extrabold text-[color:var(--primary)]">
                Phù hợp với nhóm người dùng
              </div>
              <div className="flex flex-wrap gap-2">
                {product.specsJson.recommendedFor.map((item) => (
                  <span
                    className="rounded-full bg-[color:var(--ice)] px-3 py-1 text-sm font-bold text-[color:var(--primary)]"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <GuidanceTile
                label="Phù hợp"
                text="Người làm việc với màn hình dài giờ, cần cân bằng chống chói và trung thực màu."
              />
              <GuidanceTile
                label="Cần tư vấn thêm"
                text="Độ khúc xạ cao, bệnh lý nền hoặc đang dùng toa kính chuyên biệt."
              />
            </div>
            <div className="mt-7 grid gap-3">
              <ButtonLink href="/tim-diem-ban">
                <CalendarDays size={18} />
                Tư vấn và đo mắt tại điểm bán
              </ButtonLink>
              <ButtonLink href="#technical-specs" tone="secondary">
                Xem thông số kỹ thuật
                <ArrowRight size={16} />
              </ButtonLink>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-extrabold uppercase tracking-[0.06em] text-[color:var(--muted)]">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck
                  size={15}
                  className="text-[color:var(--secondary)]"
                />
                Demo certified
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={15} className="text-[color:var(--secondary)]" />
                O2O only
              </span>
            </div>
          </aside>
        </section>

        <section
          className="bg-[color:var(--surface-soft)] section-y"
          id="technical-specs"
        >
          <div className="content-shell">
            <SectionHeader
              description="Các module dưới đây là thành phần giáo dục để người dùng hiểu khái niệm chiết suất, quang phổ và màu sắc."
              eyebrow="Interactive education"
              title="Trải nghiệm công nghệ tròng kính"
            />
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <IndexSelector />
              <SpectrumVisual />
              <div className="lg:col-span-2">
                <BeforeAfterSlider />
              </div>
            </div>
          </div>
        </section>

        <section className="content-shell section-y">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
            <div className="optical-surface rounded-3xl p-7">
              <SectionHeader
                description="OPTIQIS chỉ định hướng công nghệ, không tự động kê đơn hoặc thay thế kết quả đo khúc xạ."
                eyebrow="Medical guardrails"
                title="Luôn cần đánh giá trực tiếp trước khi chọn tròng"
              />
              <div className="mt-6">
                <MedicalDisclaimer />
              </div>
            </div>
            <div className="rounded-3xl bg-[color:var(--primary)] p-7 text-white">
              <div className="metric-label text-[color:var(--secondary-container)]">
                Clinic CTA
              </div>
              <h2 className="mt-3 text-3xl font-extrabold">
                Tìm điểm đo khám có tư vấn OPTIQIS
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/78">
                Người dùng được dẫn đến danh sách clinic/đại lý ủy quyền thay vì
                checkout online.
              </p>
              <Link
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[color:var(--primary)]"
                href="/tim-diem-ban"
              >
                Tìm trung tâm gần bạn
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="content-shell section-y pt-0">
          <ConsultationLeadForm
            productId={product.id}
            productName={product.name}
            source="PRODUCT_DETAIL"
          />
        </section>
      </main>
      <StickyProductCta productName={product.name} />
      <PublicFooter />
    </>
  );
}

function StickyProductCta({ productName }: { productName: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/50 bg-white/92 p-3 shadow-[0_-12px_34px_rgba(8,74,120,0.14)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-extrabold text-[color:var(--primary)]">
            {productName}
          </div>
          <div className="mt-0.5 text-xs font-bold text-[color:var(--muted)]">
            O2O clinic consultation
          </div>
        </div>
        <Link
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-4 py-2 text-sm font-extrabold text-white shadow-[var(--shadow-glass)]"
          href="/tim-diem-ban"
        >
          <MapPin size={16} />
          Tìm điểm bán
        </Link>
      </div>
    </div>
  );
}

function FeatureGlance({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-[color:var(--ice)] text-[color:var(--secondary)]">
          {icon}
        </span>
        <span>
          <span className="metric-label block text-[color:var(--outline)]">
            {label}
          </span>
          <span className="mt-1 block text-sm font-extrabold text-[color:var(--primary)]">
            {value}
          </span>
        </span>
      </div>
    </div>
  );
}

function GuidanceTile({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-4">
      <div className="flex items-center gap-2 text-sm font-extrabold text-[color:var(--primary)]">
        <Info size={17} className="text-[color:var(--secondary)]" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-[color:var(--muted)]">
        {text}
      </p>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-white/80 py-3 last:border-0">
      <CheckCircle2
        className="mt-0.5 shrink-0 text-[color:var(--secondary)]"
        size={18}
      />
      <div>
        <div className="metric-label text-[color:var(--outline)]">{label}</div>
        <div className="mt-1 text-sm font-bold leading-6 text-[color:var(--primary)]">
          {value}
        </div>
      </div>
    </div>
  );
}
