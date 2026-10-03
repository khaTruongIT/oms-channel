import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Eye,
  FlaskConical,
  MapPin,
  Microscope,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ArticleCard } from "@/components/article/article-card";
import { PublicFooter, PublicHeader } from "@/components/brand/public-shell";
import { ProductFilter } from "@/components/product/product-filter";
import {
  ButtonLink,
  MetricCard,
  SectionHeader,
} from "@/components/ui/primitives";
import { getArticles, getClinics, getProducts } from "@/lib/api";

export default async function HomePage() {
  const [products, articles, clinics] = await Promise.all([
    getProducts(),
    getArticles(),
    getClinics(),
  ]);
  const featuredProducts = products.filter((product) => product.isFeatured);

  return (
    <>
      <PublicHeader />
      <main>
        <section className="bg-[color:var(--primary)] text-white">
          <div className="content-shell grid min-h-[680px] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] backdrop-blur">
                <ShieldCheck size={16} />
                Nhìn rõ hơn mỗi ngày • Công nghệ quang học tiên tiến
              </div>
              <h1 className="mt-6 max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.05]">
                Thế giới rõ hơn khi đôi mắt được hiểu đúng.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">
                Khám phá giải pháp tròng kính được thiết kế cho thị lực, thói
                quen và nhịp sống của bạn, rồi kết nối đến điểm đo khám ủy quyền
                để được tư vấn trực tiếp.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink
                  className="bg-[color:var(--secondary-container)] text-[color:var(--primary)] hover:bg-white"
                  href="/san-pham"
                  tone="secondary"
                >
                  <Eye size={18} />
                  Tìm tròng kính phù hợp
                </ButtonLink>
                <ButtonLink
                  className="border border-white/30 bg-white/10 text-white hover:bg-white/15"
                  href="/san-pham#solutions"
                  tone="ghost"
                >
                  Khám phá sản phẩm
                  <ArrowRight size={18} />
                </ButtonLink>
              </div>
              <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
                <HeroMetric label="Partner network" value="450+" />
                <HeroMetric label="Medical review" value="2 lớp" />
                <HeroMetric label="Lens focus" value="O2O" />
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-[1.75rem] bg-[color:var(--surface-soft)] shadow-2xl">
                <img
                  alt="Vietnamese professional wearing clear optical lenses"
                  className="h-[560px] w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDznsian9Eu8IhHDBm0_dgsvt88aFAAqMca3TZ2Ajz6JeXCToVxady8lw-p38Vg_eFNCdJVFK-jhCOTbE21rn4M2QQ7xhN92jqJTDjHPOSv5P_lN8DCix8toZlaDEW0qUZr4Z-R0zBjrPdahT6_jYNR42D23YeFxFl8HCbtynkQ6cweLsU0QwqtlmQXvJrQP5KAFlNniOAlkdAmaEcow_9HR9grs7huVWL1oSXYSMon470eGGB5ofU9"
                />
              </div>
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/92 p-5 text-[color:var(--primary)] shadow-[var(--shadow-float)] backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="metric-label text-[color:var(--secondary)]">
                      Selective wave filtering
                    </div>
                    <div className="mt-1 text-3xl font-extrabold">
                      415-495nm
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      Giải thích công nghệ bằng ngôn ngữ dễ hiểu, kèm kiểm duyệt
                      nội dung y khoa.
                    </p>
                  </div>
                  <FlaskConical
                    className="shrink-0 text-[color:var(--secondary)]"
                    size={38}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="content-shell section-y">
          <SectionHeader
            action={
              <Link
                className="inline-flex items-center gap-2 font-extrabold text-[color:var(--primary)]"
                href="/san-pham"
              >
                Xem tất cả
                <ArrowRight size={18} />
              </Link>
            }
            description="Mỗi người nhìn thế giới theo một cách khác nhau. Hãy bắt đầu từ thói quen và nhu cầu thị giác hàng ngày."
            eyebrow="Cá nhân hóa theo sinh hoạt"
            title="Đôi mắt của bạn cần gì?"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visionNeeds.map((item) => (
              <NeedCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section className="bg-[color:var(--surface-soft)] section-y">
          <div className="content-shell">
            <SectionHeader
              align="center"
              description="Mỗi dòng sản phẩm OPTIQIS kết hợp giữa vật liệu quang học cao cấp, lớp phủ nano và ngữ cảnh sử dụng đời thực."
              eyebrow="Bộ sưu tập tròng kính đặc chế"
              title="Giải pháp cho từng cách bạn nhìn."
            />
            <div className="mt-10 space-y-8">
              {featuredProducts.map((product, index) => (
                <FeaturedSolution
                  flip={index % 2 === 1}
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </div>
        </section>

        <ProductFilter products={products} />

        <section className="content-shell section-y" id="technology">
          <SectionHeader
            description="Dùng visual và chỉ số dễ đọc để kể câu chuyện về truyền qua, phủ nano, HEV và tiêu chuẩn."
            eyebrow="Optical technology"
            title="Khoa học tròng kính được kể như một trải nghiệm editorial"
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <TechCard
              icon={<Microscope size={24} />}
              label="Nano-AR"
              title="Phủ đa tầng giảm phản xạ tồn dư"
            />
            <TechCard
              icon={<Sparkles size={24} />}
              label="True-Color"
              title="Giữ cân bằng màu sắc, tránh ám vàng cực đoan"
            />
            <TechCard
              icon={<ShieldCheck size={24} />}
              label="ISO 8980-3"
              title="Khung tham chiếu truyền qua cho nội dung giáo dục"
            />
          </div>
        </section>

        <section className="bg-white section-y">
          <div className="content-shell">
            <SectionHeader
              action={
                <Link
                  className="inline-flex items-center gap-2 font-extrabold text-[color:var(--primary)]"
                  href="/kien-thuc"
                >
                  Vào knowledge hub
                  <ArrowRight size={18} />
                </Link>
              }
              description="Mỗi bài viết cần tác giả, người thẩm định, nguồn tham khảo và CTA sản phẩm theo ngữ cảnh."
              eyebrow="Kiến thức thị giác"
              title="Góc nhìn chuyên gia và tài liệu tham khảo"
            />
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {articles.slice(0, 3).map((article) => (
                <ArticleCard article={article} key={article.id} />
              ))}
            </div>
          </div>
        </section>

        <section className="content-shell section-y">
          <div className="grid overflow-hidden rounded-3xl bg-[color:var(--primary)] text-white lg:grid-cols-[1fr_0.8fr]">
            <div className="p-8 md:p-12">
              <div className="metric-label text-[color:var(--secondary-container)]">
                Authorized clinic network
              </div>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
                Không bán online. Dẫn người dùng đến nơi đo khám đúng chuẩn.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">
                MVP giữ đúng định vị O2O: giáo dục và định hướng trước, đo khúc
                xạ và tư vấn cuối cùng tại điểm bán hoặc phòng khám ủy quyền.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink
                  className="bg-white text-[color:var(--primary)] hover:bg-[color:var(--ice)]"
                  href="/tim-diem-ban"
                  tone="secondary"
                >
                  <MapPin size={18} />
                  Tìm điểm gần bạn
                </ButtonLink>
                <ButtonLink
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
                  href="tel:18006919"
                  tone="ghost"
                >
                  Hotline 1800 6919
                </ButtonLink>
              </div>
            </div>
            <div className="bg-white/8 p-6 md:p-8">
              <div className="space-y-3">
                {clinics.slice(0, 3).map((clinic) => (
                  <div
                    className="rounded-2xl bg-white p-5 text-[color:var(--primary)]"
                    key={clinic.id}
                  >
                    <div className="metric-label text-[color:var(--secondary)]">
                      {clinic.province}
                    </div>
                    <h3 className="mt-2 font-extrabold">{clinic.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {clinic.address}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
      <div className="metric-label text-white/58">{label}</div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

const visionNeeds = [
  {
    code: "Digital work",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB4fgSPXajaQAhmwybUXmARRkIjWBbUlDHzeQuAiBp6DjPm5g5mlxs8TkmMW1bC-1f5n7PWkoovoxHbGJo46aIyicwyva7sgfXWXQLEdxnSTvQZN-V-T3uku6foWWyU0TZuQFOAwVy_9Z2O0tNJkwO8_m-7cmpRCou4jG_lRLqMfDFqKj23t4PMklggZ6nw1p5yQf00BmTnDMZ_MvwsvE8fUwf3VTMjT8wFGy7L3yZjtL01Mdj9QNw9",
    title: "Làm việc với màn hình",
    text: "Thoải mái hơn trong những giờ làm việc dài trước máy tính và điện thoại.",
  },
  {
    code: "Mobility",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDu8OkHVCDUS4dY_lMooRXvqm_PCD14excrioLLUTif038ECYeKqIcZwQGMdFeaY6YHT5xSr3BbD7GPJtx8b0q_e9V0QXZhIMqPKgTCdJxtNjmeWiy-yr_vySQaV-qwVsO551rOyzBbkC9BFfeINvYFPvAaM8kG-BM609g215N2hL3hxiteH5DYoxIssGZgTvsQABQf21UcLFgcoWA78u2cwftzO72IDxrDWpCo8EuC1i-QafhnvqQ2",
    title: "Lái xe ngày và đêm",
    text: "Giảm chói và tăng tương phản trong điều kiện ánh sáng phức tạp.",
  },
  {
    code: "Photochromic",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCU9tgOj-j7S0fv4CxZRkQHiCidhTJyh4uEcj1Ui_xM7skJav_ZwyjYZYBVdvY-OVyIIP-mhGRdyHPoeTb4OCHGx7boNCXanHatEr_7zv5PRToC4qZtQSqbabhxD7q5YCwd8cpAvZJX5yu49FeIaqdgBJyHcO2d-ij_A3uq8Ot29IdzDnV4hf7UfeLCeq0kt9XfI07ft8zqA6c9uhWov81rgQHRKJzv55YLbmDMgV7fsPUV_J3esVe7",
    title: "Hoạt động ngoài trời",
    text: "Thích ứng sắc độ theo UV, chuyển đổi mượt giữa trong nhà và ngoài trời.",
  },
  {
    code: "High-index",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDh-ikgSoY2bIsRjQtwvy-ob3ULcMZ9rgFraTYBFz6y5fsb8Sfk0058XrPH3SNLyANG6s3zXDBoGkvJtz2Mhizzo8LWRtQz96Y40zDZL6COaGvWTFHvBtbxQbRddFn-3TVk63-6fhQDeuF_DoVHPyn264f7-ro9JYF51Bfu-aakPGIwqzwCGDCf5cB5CpOdi5SrJn2J4y1-nf4294HcTspbCju0-a4cTrYsLn1QrSx8kQ-wNSEJMTs5",
    title: "Độ cận cao",
    text: "Mỏng hơn, nhẹ hơn và cân bằng thẩm mỹ cho gọng cần mép tròng tinh gọn.",
  },
  {
    code: "Presbyopia",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBWa3ZKXYZan5bblxjO1nezoDzbLtszi8OS6q9ojLKc9i24h3ELjtcZMH9_EYqdbXpG7KSy3BNB99E-7aMIW_dceQLBUF4d1P9Xx0U0L7JNw-Pgva5yparE37bFR-TYmylEy1-ILKqzERbazZzfExKynazrXwfmPGkZSIaRpoU6dtqJxT5egBMzRSDh3q-18eefOUzd0Swqu6bPV5BrgkCDnlmd8BGPm1AJTi3gG1VtV9Kvmr9B_LIa",
    title: "Thị lực tuổi 40+",
    text: "Chuyển tiếp mượt giữa tầm gần, trung gian và xa cho nhịp làm việc hiện đại.",
  },
  {
    code: "Myopia management",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtdh-sR5mmvgJtCblJFghY6C-xl1hY6yTdT8RHVyCpGhvYfuKQy2BZFcqSPxuk9ubctxPYHIhv0kIwpJI50iC06-XLKJ-8sZMJKBPDhq0-7iiYFzgeB0ENA8KKrljHb4yrXAaNPl9h6CDOh7qVeDIJHGADdwuzwZE2PHOdqyKIFg3CnjcsXktTt1_caCjs9cvYFrtAu5mdddGi7jx39gXs7rHtde2YvovQGQFwp2L_KLmppS0ny3gc",
    title: "Trẻ em và học đường",
    text: "Bảo vệ an toàn, hỗ trợ theo dõi tiến triển cận thị cùng chuyên gia khúc xạ.",
  },
] as const;

function NeedCard({
  code,
  image,
  title,
  text,
}: {
  code: string;
  image: string;
  title: string;
  text: string;
}) {
  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-[var(--shadow-editorial)] ring-1 ring-[color:var(--border-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-float)]">
      <div className="relative h-48 overflow-hidden rounded-xl bg-[color:var(--surface-soft)]">
        <img
          alt={`${title} OPTIQIS lifestyle visual`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          src={image}
        />
        <span className="absolute left-3 top-3 rounded bg-[color:var(--primary)]/86 px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-white backdrop-blur">
          {code}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-2 pt-5">
        <h3 className="text-xl font-extrabold leading-snug text-[color:var(--primary)] group-hover:text-[color:var(--secondary)]">
          {title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-[color:var(--muted)]">
          {text}
        </p>
        <Link
          className="mt-5 inline-flex items-center gap-1 text-sm font-extrabold text-[color:var(--secondary)]"
          href="/san-pham"
        >
          Tìm giải pháp phù hợp
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

function FeaturedSolution({
  product,
  flip = false,
}: {
  product: Awaited<ReturnType<typeof getProducts>>[number];
  flip?: boolean;
}) {
  return (
    <article className="grid items-center gap-8 rounded-3xl bg-white p-5 shadow-[var(--shadow-editorial)] ring-1 ring-[color:var(--border-soft)] lg:grid-cols-12 lg:p-8">
      <div className={flip ? "lg:order-2 lg:col-span-6" : "lg:col-span-6"}>
        <div className="relative min-h-[320px] overflow-hidden rounded-2xl bg-[color:var(--surface-soft)]">
          <img
            alt={`${product.name} editorial optical solution`}
            className="absolute inset-0 h-full w-full object-cover"
            src={product.heroImage}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/25 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-xl bg-white/90 p-3 text-xs font-extrabold uppercase tracking-[0.07em] text-[color:var(--primary)] backdrop-blur">
            <span>{product.specsJson.wavelength.adverse}</span>
            <span className="text-[color:var(--secondary)]">
              {product.specsJson.uvProtection}
            </span>
          </div>
        </div>
      </div>
      <div className={flip ? "lg:order-1 lg:col-span-6" : "lg:col-span-6"}>
        <div className="metric-label text-[color:var(--secondary)]">
          {product.line}
        </div>
        <h3 className="mt-3 text-3xl font-extrabold leading-tight text-[color:var(--primary)]">
          {product.name}
        </h3>
        <p className="mt-4 text-base leading-7 text-[color:var(--muted)]">
          {product.summary}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MetricCard label="Chiết suất" value={product.indexes.join(" · ")} />
          <MetricCard
            label="Lớp phủ"
            value={product.coatings[0] ?? "Nano-AR"}
          />
        </div>
        <Link
          className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[color:var(--primary)] hover:text-[color:var(--secondary)]"
          href={`/san-pham/${product.slug}`}
        >
          Xem công nghệ chi tiết
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

function TechCard({
  icon,
  label,
  title,
}: {
  icon: ReactNode;
  label: string;
  title: string;
}) {
  return (
    <div className="optical-surface-soft rounded-2xl p-6">
      <div className="grid size-12 place-items-center rounded-xl bg-white text-[color:var(--secondary)] shadow-[var(--shadow-glass)]">
        {icon}
      </div>
      <div className="metric-label mt-5 text-[color:var(--secondary)]">
        {label}
      </div>
      <h3 className="mt-2 text-xl font-extrabold leading-snug text-[color:var(--primary)]">
        {title}
      </h3>
    </div>
  );
}
