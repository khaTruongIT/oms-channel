import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Clock, ShieldCheck, UserRoundCheck } from "lucide-react";
import { ArticleBody } from "@/components/article/article-body";
import { PublicFooter, PublicHeader } from "@/components/brand/public-shell";
import { Breadcrumbs } from "@/components/ui/primitives";
import { getArticle } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <>
      <PublicHeader />
      <main>
        <div className="sticky top-[104px] z-20 h-1 bg-[color:var(--surface-container-high)]">
          <div className="h-full w-1/2 bg-[color:var(--secondary)]" />
        </div>
        <Breadcrumbs
          items={[
            { href: "/", label: "Trang chủ" },
            { href: "/kien-thuc", label: "Kiến thức về mắt" },
            { label: article.category },
          ]}
        />
        <section className="bg-white py-12">
          <div className="content-shell">
            <div className="max-w-5xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
                  <ShieldCheck size={15} />
                  {article.category}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--primary)]">
                  Peer reviewed
                </span>
              </div>
              <h1 className="display-title mt-5 max-w-5xl text-[color:var(--primary)]">
                {article.title}
              </h1>
              <p className="mt-5 max-w-4xl text-lg leading-8 text-[color:var(--muted)]">
                {article.excerpt}
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-[color:var(--surface-soft)] p-5 shadow-[var(--shadow-glass)] md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-5">
                <GovernanceChip
                  icon={<UserRoundCheck size={18} />}
                  label="Biên soạn"
                  value={article.author?.name ?? "OPTIQIS Editorial"}
                />
                <GovernanceChip
                  icon={<ShieldCheck size={18} />}
                  label="Thẩm định"
                  value={article.reviewer?.name ?? "Medical reviewer"}
                />
                <GovernanceChip
                  icon={<Clock size={18} />}
                  label="Cập nhật"
                  value={formatDate(article.publishedAt)}
                />
              </div>
              <div className="text-sm font-bold text-[color:var(--muted)]">
                Nội dung giáo dục, không thay thế chẩn đoán
              </div>
            </div>
          </div>
        </section>
        <ArticleBody article={article} />
      </main>
      <PublicFooter />
    </>
  );
}

function GovernanceChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-full bg-white text-[color:var(--secondary)]">
        {icon}
      </span>
      <span>
        <span className="block text-xs font-extrabold uppercase tracking-[0.06em] text-[color:var(--outline)]">
          {label}
        </span>
        <span className="block text-sm font-extrabold text-[color:var(--primary)]">
          {value}
        </span>
      </span>
    </div>
  );
}
