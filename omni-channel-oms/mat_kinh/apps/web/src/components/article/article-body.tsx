import Link from "next/link";
import type { Article } from "@optiqis/shared";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { MedicalDisclaimer } from "@/components/brand/medical-disclaimer";

export function ArticleBody({ article }: { article: Article }) {
  const headings = article.contentJson.filter(
    (block) => block.type === "heading",
  );
  const references = article.contentJson.filter(
    (block) => block.type === "reference",
  );

  return (
    <div className="content-shell grid gap-8 py-12 lg:grid-cols-[1fr_340px]">
      <article className="min-w-0">
        <div className="medical-prose space-y-7 rounded-3xl bg-white p-6 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)] md:p-9">
          {article.contentJson.map((block) => {
            if (block.type === "heading") {
              return (
                <section className="scroll-mt-28" id={block.id} key={block.id}>
                  <h2>{block.text}</h2>
                </section>
              );
            }
            if (block.type === "callout") {
              return (
                <aside
                  className="rounded-2xl bg-[color:var(--surface-soft)] p-5 font-bold leading-7 text-[color:var(--primary)]"
                  key={block.id}
                >
                  <div className="flex gap-3">
                    <ShieldCheck
                      className="mt-0.5 shrink-0 text-[color:var(--secondary)]"
                      size={20}
                    />
                    <p>{block.text}</p>
                  </div>
                </aside>
              );
            }
            if (block.type === "reference") {
              return null;
            }
            return <p key={block.id}>{block.text}</p>;
          })}

          {article.relatedProducts?.[0] ? (
            <div className="rounded-2xl bg-gradient-to-br from-white to-[color:var(--surface-soft)] p-5 shadow-[var(--shadow-glass)]">
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <img
                  alt={`${article.relatedProducts[0].name} related optical solution`}
                  className="h-36 w-full rounded-xl object-cover md:w-44"
                  src={article.relatedProducts[0].heroImage}
                />
                <div className="flex-1">
                  <div className="metric-label text-[color:var(--secondary)]">
                    Giải pháp liên quan
                  </div>
                  <h3 className="mt-2 text-xl font-extrabold text-[color:var(--primary)]">
                    {article.relatedProducts[0].name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {article.relatedProducts[0].summary}
                  </p>
                </div>
                <Link
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-5 py-3 text-sm font-extrabold text-white"
                  href={`/san-pham/${article.relatedProducts[0].slug}`}
                >
                  Xem giải pháp
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : null}

          {references.length > 0 ? (
            <section className="rounded-2xl bg-[color:var(--surface-soft)] p-5">
              <div className="flex items-center gap-2 font-extrabold text-[color:var(--primary)]">
                <BookOpen size={18} />
                Tài liệu tham khảo
              </div>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-[color:var(--muted)]">
                {references.map((reference) => (
                  <li key={reference.id}>{reference.text}</li>
                ))}
              </ol>
            </section>
          ) : null}

          <MedicalDisclaimer />
        </div>
      </article>

      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div className="font-extrabold text-[color:var(--primary)]">
              Mục lục
            </div>
            <span className="rounded-full bg-[color:var(--ice)] px-2.5 py-1 text-xs font-extrabold text-[color:var(--secondary)]">
              {headings.length} mục
            </span>
          </div>
          <nav className="mt-4 space-y-2">
            {headings.map((heading, index) => (
              <a
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[color:var(--muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--primary)]"
                href={`#${heading.id}`}
                key={heading.id}
              >
                <span className="size-1.5 rounded-full bg-[color:var(--secondary)]" />
                {index + 1}. {heading.text}
              </a>
            ))}
          </nav>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
          <div className="metric-label text-[color:var(--secondary)]">
            Medical governance
          </div>
          <div className="mt-4 space-y-4">
            <GovernanceRow
              label="Tác giả"
              value={article.author?.name ?? "OPTIQIS Editorial"}
            />
            <GovernanceRow
              label="Thẩm định"
              value={article.reviewer?.name ?? "Medical reviewer"}
            />
            <GovernanceRow
              label="Chứng chỉ"
              value={article.reviewer?.credential ?? "Clinical review"}
            />
            <GovernanceRow
              label="Cập nhật"
              value={
                article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString("vi-VN")
                  : "Demo"
              }
            />
          </div>
        </div>

        <div className="rounded-2xl bg-[color:var(--primary)] p-5 text-white">
          <div className="flex items-center gap-2 text-[color:var(--secondary-container)]">
            <CalendarDays size={18} />
            <span className="metric-label">O2O support</span>
          </div>
          <h3 className="mt-3 text-xl font-extrabold">Cần tư vấn trực tiếp?</h3>
          <p className="mt-2 text-sm leading-6 text-white/72">
            Nội dung chỉ để giáo dục. Hãy đo khúc xạ tại điểm bán/clinic được ủy
            quyền.
          </p>
          <Link
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--secondary-container)] px-4 py-3 text-sm font-extrabold text-[color:var(--primary)] shadow-[var(--shadow-glass)] transition hover:bg-white"
            href="/tim-diem-ban"
          >
            Tìm điểm đo mắt gần tôi
            <ArrowRight size={16} />
          </Link>
          {article.relatedProducts?.[0] ? (
            <Link
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/28 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
              href={`/san-pham/${article.relatedProducts[0].slug}`}
            >
              Xem sản phẩm được nhắc đến
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function GovernanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2
        className="mt-0.5 shrink-0 text-[color:var(--secondary)]"
        size={18}
      />
      <div>
        <div className="text-xs font-extrabold uppercase tracking-[0.06em] text-[color:var(--outline)]">
          {label}
        </div>
        <div className="mt-1 text-sm font-bold leading-6 text-[color:var(--primary)]">
          {value}
        </div>
      </div>
    </div>
  );
}
