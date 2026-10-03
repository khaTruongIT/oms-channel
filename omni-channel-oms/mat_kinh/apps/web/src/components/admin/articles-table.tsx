"use client";

import Link from "next/link";
import type { Article, User } from "@optiqis/shared";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  FileText,
  PlusCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useState, useMemo } from "react";
import { StatusBadge } from "@/components/brand/status-badge";
import { MetricCard } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "PENDING_MEDICAL_REVIEW", label: "Chờ duyệt y khoa" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "SCHEDULED", label: "Đã lên lịch" },
  { value: "PUBLISHED", label: "Đã xuất bản" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "Tất cả chuyên mục" },
  { value: "CVS", label: "CVS" },
  { value: "Myopia", label: "Myopia" },
  { value: "Blue Light", label: "Blue Light" },
];

export function ArticlesTable({
  articles,
  user,
}: {
  articles: Article[];
  user: User | null;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Role-aware: can EDITOR create articles?
  const canCreate = user?.role === "ADMIN" || user?.role === "EDITOR";
  // Role-aware: can ADMIN/EDITOR publish? MEDICAL_REVIEWER cannot.
  const canPublish = user?.role === "ADMIN" || user?.role === "EDITOR";

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchQuery =
        !query ||
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
        a.author?.name.toLowerCase().includes(query.toLowerCase());
      const matchStatus = !statusFilter || a.status === statusFilter;
      const matchCategory = !categoryFilter || a.category === categoryFilter;
      return matchQuery && matchStatus && matchCategory;
    });
  }, [articles, query, statusFilter, categoryFilter]);

  const published = articles.filter((a) => a.status === "PUBLISHED").length;
  const review = articles.filter((a) => a.status === "PENDING_MEDICAL_REVIEW").length;
  const drafts = articles.filter((a) => a.status === "DRAFT").length;
  const averageSeo = Math.round(
    articles.reduce((sum, a) => sum + a.seoScore, 0) / articles.length,
  );

  return (
    <div className="p-5 lg:p-8">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ice)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
            <ShieldCheck size={15} />
            Clinical knowledge base
          </div>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[color:var(--primary)]">
            Quản lý bài viết & kiến thức thị giác
          </h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            Dashboard quản lý quy trình biên tập, kiểm duyệt y khoa và tối ưu SEO on-page.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[color:var(--primary)] shadow-[var(--shadow-glass)]"
            type="button"
          >
            <BookOpenCheck size={18} />
            Editorial guide
          </button>
          {canCreate && (
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--primary)] px-5 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-glass)]"
              href="/admin/articles/article-cvs-blue-light/edit"
            >
              <PlusCircle size={18} />
              Mở editor demo
            </Link>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Nội dung đang hiển thị public" label="Đã xuất bản" value={published} />
        <MetricCard
          detail="Cần reviewer đọc và approve"
          label="Chờ duyệt"
          tone="amber"
          value={review}
        />
        <MetricCard detail="Đang trong quá trình soạn" label="Bản nháp" tone="muted" value={drafts} />
        <MetricCard detail="Điểm kiểm tra nội bộ" label="SEO TB" value={`${averageSeo}/100`} />
      </div>

      {/* Filters */}
      <div className="mt-8 rounded-2xl bg-white p-4 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          {/* Search input */}
          <div className="flex min-h-12 items-center gap-3 rounded-xl bg-[color:var(--surface-soft)] px-3">
            <Search className="shrink-0 text-[color:var(--secondary)]" size={18} />
            <input
              className="w-full bg-transparent text-sm font-semibold text-[color:var(--primary)] outline-none placeholder:text-[color:var(--muted)]"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, tag, tác giả..."
              type="text"
              value={query}
            />
          </div>

          {/* Status filter */}
          <select
            className="min-h-12 rounded-xl bg-[color:var(--surface-soft)] px-3 text-sm font-bold text-[color:var(--primary)] outline-none"
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            className="min-h-12 rounded-xl bg-[color:var(--surface-soft)] px-3 text-sm font-bold text-[color:var(--primary)] outline-none"
            onChange={(e) => setCategoryFilter(e.target.value)}
            value={categoryFilter}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active filter count */}
        {(query || statusFilter || categoryFilter) && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[color:var(--muted)]">
            <span>
              Hiển thị <strong className="text-[color:var(--primary)]">{filtered.length}</strong> /{" "}
              {articles.length} bài viết
            </span>
            <button
              className="ml-auto rounded-full bg-[color:var(--surface-soft)] px-3 py-1 font-bold text-[color:var(--primary)] hover:bg-[color:var(--ice)]"
              onClick={() => {
                setQuery("");
                setStatusFilter("");
                setCategoryFilter("");
              }}
              type="button"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead className="bg-[color:var(--surface-soft)] text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--muted)]">
              <tr>
                <th className="px-5 py-4">Bài viết</th>
                <th className="px-5 py-4">Chuyên mục</th>
                <th className="px-5 py-4">Tác giả / reviewer</th>
                <th className="px-5 py-4">SEO</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Ngày</th>
                {canPublish && <th className="px-5 py-4">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    className="px-5 py-12 text-center text-sm font-semibold text-[color:var(--muted)]"
                    colSpan={canPublish ? 7 : 6}
                  >
                    Không tìm thấy bài viết nào phù hợp.
                  </td>
                </tr>
              )}
              {filtered.map((article, index) => (
                <tr
                  className="border-t border-[color:var(--border-soft)] hover:bg-[color:var(--surface-soft)]/60"
                  key={article.id}
                >
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-[color:var(--surface-soft)] text-[color:var(--secondary)]">
                        <FileText size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[color:var(--outline)]">
                          #OPT-{8920 + index}
                        </div>
                        <Link
                          className="mt-1 line-clamp-2 block font-extrabold leading-snug text-[color:var(--primary)] hover:text-[color:var(--secondary)]"
                          href={`/admin/articles/${article.id}/edit`}
                        >
                          {article.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-xs font-bold text-[color:var(--muted)]">
                          <Clock size={14} />
                          {Math.max(4, article.contentJson.length * 2)} phút đọc
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-[color:var(--primary)]">{article.category}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span
                          className="rounded bg-[color:var(--surface-soft)] px-2 py-0.5 text-xs font-bold text-[color:var(--muted)]"
                          key={tag}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <div className="font-bold text-[color:var(--primary)]">{article.author?.name}</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-[color:var(--muted)]">
                      <CheckCircle2 size={14} className="text-[color:var(--secondary)]" />
                      {article.reviewer?.name}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-extrabold text-[color:var(--primary)]">
                      {article.seoScore}/100
                    </div>
                    <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-[color:var(--surface-container-high)]">
                      <div
                        className="h-full rounded-full bg-[color:var(--secondary)]"
                        style={{ width: `${article.seoScore}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={article.status} />
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[color:var(--muted)]">
                    {formatDate(article.publishedAt)}
                  </td>
                  {canPublish && (
                    <td className="px-5 py-4">
                      <Link
                        className="rounded-lg bg-[color:var(--ice)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--primary)] hover:bg-[color:var(--primary)] hover:text-white"
                        href={`/admin/articles/${article.id}/edit`}
                      >
                        Chỉnh sửa
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
