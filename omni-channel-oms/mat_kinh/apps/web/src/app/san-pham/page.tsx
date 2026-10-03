import type { ReactNode } from "react";
import { Activity, CheckCircle2, Layers, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/brand/public-shell";
import { ProductFilter } from "@/components/product/product-filter";
import { Breadcrumbs, SectionHeader } from "@/components/ui/primitives";
import { getProducts } from "@/lib/api";

export default async function ProductsPage() {
  const products = await getProducts();
  const comparison = products.slice(0, 4);

  return (
    <>
      <PublicHeader />
      <main>
        <Breadcrumbs
          items={[
            { href: "/", label: "Trang chủ" },
            { label: "Danh mục sản phẩm quang học OPTIQIS" },
          ]}
        />
        <section className="bg-white py-14">
          <div className="content-shell">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
                <ShieldCheck size={15} />
                Need-based optical matrix
              </div>
              <h1 className="display-title mt-5 text-[color:var(--primary)]">
                Dải giải pháp thấu kính chuẩn y khoa cho từng thói quen thị
                giác.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--muted)]">
                Catalog này là bản tư vấn giáo dục. Lựa chọn cuối cùng cần dựa
                trên kết quả đo khúc xạ, thông số gọng và đánh giá của chuyên
                viên.
              </p>
            </div>
            <div className="mt-10 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {[
                ["Digital", "Chống ánh sáng xanh"],
                ["Free-Form", "Đa tròng kỹ thuật số"],
                ["D.I.M.S", "Kiểm soát cận thị"],
                ["1.74", "Siêu mỏng thẩm mỹ"],
                ["Drive", "Chống lóa khi lái xe"],
              ].map(([code, label]) => (
                <span
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--surface-soft)] px-5 py-2.5 text-sm font-extrabold text-[color:var(--primary)]"
                  key={code}
                >
                  <span className="size-1.5 rounded-full bg-[color:var(--secondary)]" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>
        <ProductFilter products={products} />
        <section
          className="bg-[color:var(--surface-soft)] section-y"
          id="technology"
        >
          <div className="content-shell">
            <SectionHeader
              description="Bảng này giữ vai trò storytelling và so sánh nhanh, không phải báo giá hay cấu hình kê đơn."
              eyebrow="Spec comparison"
              title="So sánh nhanh các thông số quang học cốt lõi"
            />
            <div className="mt-8 overflow-x-auto rounded-3xl bg-white p-4 shadow-[var(--shadow-glass)]">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="bg-[color:var(--surface-soft)]">
                    <th className="rounded-l-2xl px-5 py-4 text-sm font-extrabold text-[color:var(--primary)]">
                      Tiêu chí
                    </th>
                    {comparison.map((product, index) => (
                      <th
                        className={
                          index === comparison.length - 1
                            ? "rounded-r-2xl px-5 py-4"
                            : "px-5 py-4"
                        }
                        key={product.id}
                      >
                        <span className="block text-sm font-extrabold text-[color:var(--primary)]">
                          {product.line}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <ComparisonRow
                    icon={<Layers size={18} />}
                    label="Chiết suất"
                    values={comparison.map((product) =>
                      product.indexes.join(" / "),
                    )}
                  />
                  <ComparisonRow
                    icon={<Activity size={18} />}
                    label="Lớp phủ"
                    values={comparison.map(
                      (product) => product.coatings[0] ?? "Nano-AR",
                    )}
                  />
                  <ComparisonRow
                    icon={<CheckCircle2 size={18} />}
                    label="Ứng dụng"
                    values={comparison.map(
                      (product) =>
                        product.specsJson.recommendedFor[0] ?? product.line,
                    )}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function ComparisonRow({
  icon,
  label,
  values,
}: {
  icon: ReactNode;
  label: string;
  values: string[];
}) {
  return (
    <tr className="border-b border-[color:var(--border-soft)] last:border-0">
      <td className="px-5 py-4 font-extrabold text-[color:var(--primary)]">
        <span className="flex items-center gap-2 text-[color:var(--secondary)]">
          {icon}
          <span className="text-[color:var(--primary)]">{label}</span>
        </span>
      </td>
      {values.map((value) => (
        <td
          className="px-5 py-4 font-semibold text-[color:var(--muted)]"
          key={value}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}
