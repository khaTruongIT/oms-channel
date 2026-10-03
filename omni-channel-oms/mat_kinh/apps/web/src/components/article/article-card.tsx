import Link from "next/link";
import type { Article } from "@optiqis/shared";
import { ArrowRight, ShieldCheck, Stethoscope } from "lucide-react";
import { formatDate } from "@/lib/format";

export function ArticleCard({ article }: { article: Article }) {
  const image =
    article.relatedProducts?.[0]?.heroImage ??
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDdbf0RSBZ7t6fDhn70fLpF-U_CTsMKwoYRyrIYRJqspiF8PlsivNK1EYFJxUMfElB_oIf9oWfTzfkK7kVcAqr2rFhMsl2eYz44jWnH61JS78p12JNJrZiqB2nSXnoBNR7C65ZqKhU8FpPNwk1Lzr7hTsOFCzCbquqMP_QSKh4t9mGBg8YgTddGLC4f_Jjg9d3zUxnYxfe6OW4N_R6MsQMD2FXzq4wCIF0vRnTXco3KgfWNy3Q4pUCs";

  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-editorial)] ring-1 ring-[color:var(--border-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-float)]">
      <div className="relative h-52 overflow-hidden bg-[color:var(--surface-soft)]">
        <img
          alt={`${article.title} editorial visual`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          src={image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/18 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.08em]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[color:var(--secondary)] backdrop-blur">
            <Stethoscope size={14} />
            {article.category}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[color:var(--primary)] backdrop-blur">
            <ShieldCheck size={14} />
            Reviewed
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-extrabold leading-snug text-[color:var(--primary)] group-hover:text-[color:var(--secondary)]">
          <Link href={`/kien-thuc/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-[color:var(--muted)]">
          {article.excerpt}
        </p>
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-[color:var(--border-soft)] pt-4 text-xs font-bold text-[color:var(--muted)]">
          <span>{formatDate(article.publishedAt)}</span>
          <Link
            className="inline-flex items-center gap-1 text-[color:var(--primary)]"
            href={`/kien-thuc/${article.slug}`}
          >
            Đọc bài
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
