import Link from "next/link";
import { ArrowRight, BookOpenCheck, Search, ShieldCheck } from "lucide-react";
import { ArticleCard } from "@/components/article/article-card";
import { PublicFooter, PublicHeader } from "@/components/brand/public-shell";
import { Breadcrumbs, SectionHeader } from "@/components/ui/primitives";
import { getArticles } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default async function KnowledgePage() {
  const articles = await getArticles();
  const [featured, ...rest] = articles;
  const categories = Array.from(
    new Set(articles.map((article) => article.category)),
  );

  return (
    <>
      <PublicHeader />
      <main>
        <Breadcrumbs
          items={[
            { href: "/", label: "Trang chủ" },
            { label: "Kiến thức về mắt" },
          ]}
        />
        <section className="bg-white py-14">
          <div className="content-shell">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
                <BookOpenCheck size={15} />
                Medical knowledge hub
              </div>
              <h1 className="display-title mt-5 text-[color:var(--primary)]">
                Cẩm nang thị giác và quang học lâm sàng cho người dùng hiện đại.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--muted)]">
                Nội dung được trình bày theo hướng giáo dục: có tác giả, người
                thẩm định, nguồn tham khảo và giải pháp tròng kính liên quan.
              </p>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-[color:var(--surface-soft)] px-4">
                <Search className="text-[color:var(--secondary)]" size={18} />
                <span className="text-sm font-semibold text-[color:var(--muted)]">
                  Search demo: CVS, chiết suất, D.I.M.S, ánh sáng xanh
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {categories.map((category) => (
                  <span
                    className="shrink-0 rounded-full bg-[color:var(--surface-soft)] px-4 py-3 text-sm font-extrabold text-[color:var(--primary)]"
                    key={category}
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {featured ? (
          <section className="content-shell py-10">
            <article className="grid overflow-hidden rounded-3xl bg-[color:var(--primary)] text-white lg:grid-cols-[0.95fr_1.05fr]">
              <div className="p-8 md:p-12">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary-container)]">
                  <ShieldCheck size={15} />
                  Bài viết nổi bật
                </div>
                <h2 className="mt-5 text-3xl font-extrabold leading-tight md:text-5xl">
                  {featured.title}
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">
                  {featured.excerpt}
                </p>
                <div className="mt-6 text-sm font-bold text-white/62">
                  {formatDate(featured.publishedAt)} · {featured.author?.name} ·{" "}
                  {featured.reviewer?.name}
                </div>
                <Link
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[color:var(--primary)]"
                  href={`/kien-thuc/${featured.slug}`}
                >
                  Đọc phân tích
                  <ArrowRight size={16} />
                </Link>
              </div>
              <div className="bg-[linear-gradient(135deg,rgba(89,184,253,0.26),rgba(255,255,255,0.1))] p-8">
                <div className="grid h-full min-h-72 place-items-center rounded-3xl border border-white/18 bg-white/10 p-8 backdrop-blur">
                  <div className="text-center">
                    <div className="mx-auto grid size-20 place-items-center rounded-full bg-white text-[color:var(--primary)]">
                      <BookOpenCheck size={36} />
                    </div>
                    <div className="mt-6 text-4xl font-extrabold">20-20-20</div>
                    <p className="mt-3 text-sm font-bold uppercase tracking-[0.12em] text-white/70">
                      Digital eye strain education
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </section>
        ) : null}

        <section className="content-shell section-y">
          <SectionHeader
            description="Danh sách bài viết public chỉ hiển thị nội dung đã xuất bản."
            eyebrow="Article library"
            title="Chủ đề đang được quan tâm"
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {(featured ? rest : articles).map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
