"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import type { Article, ArticleStatus, Product } from "@optiqis/shared";
import { articleStatuses, scoreSeo } from "@optiqis/shared";
import {
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  SearchCheck,
  Send,
  ShieldCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/brand/status-badge";
import { Button, FieldShell } from "@/components/ui/primitives";
import {
  saveArticleAction,
  updateArticleStatusAction,
} from "@/app/admin/articles/actions";

export function ArticleEditor({
  article,
  products,
}: {
  article: Article;
  products: Product[];
}) {
  const [draft, setDraft] = useState(article);
  const [message, setMessage] = useState(
    "Đang dùng fallback nếu API chưa chạy.",
  );
  const currentStatusIndex = articleStatuses.indexOf(draft.status);
  const [isPending, startTransition] = useTransition();
  const bodyText = draft.contentJson.map((block) => block.text).join("\n\n");
  const seo = useMemo(
    () =>
      scoreSeo({
        title: draft.title,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        slug: draft.slug,
        category: draft.category,
        relatedProductIds: draft.relatedProducts?.map((product) => product.id),
      }),
    [draft],
  );

  function patch<K extends keyof Article>(key: K, value: Article[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function patchBody(value: string): void {
    patch("contentJson", [
      { id: "edited-heading", type: "heading", text: "Nội dung biên tập" },
      { id: "edited-body", type: "paragraph", text: value },
      {
        id: "edited-callout",
        type: "callout",
        text: "Nội dung chỉ mang tính giáo dục thị giác.",
      },
    ]);
  }

  function persist(): void {
    startTransition(async () => {
      try {
        const saved = await saveArticleAction(draft.id, {
          ...draft,
          seoScore: seo.score,
          relatedProducts: undefined,
        });
        setDraft(saved);
        setMessage("Đã lưu vào API.");
      } catch {
        setDraft((current) => ({ ...current, seoScore: seo.score }));
        setMessage("API chưa sẵn sàng, bản demo vẫn được cập nhật trên UI.");
      }
    });
  }

  function moveStatus(status: ArticleStatus): void {
    startTransition(async () => {
      try {
        const saved = await updateArticleStatusAction(draft.id, status);
        setDraft(saved);
        setMessage(`Đã chuyển trạng thái sang ${status}.`);
      } catch (error: unknown) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Không thể chuyển trạng thái.",
        );
      }
    });
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[color:var(--ice)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
              #{draft.id}
            </span>
            <StatusBadge status={draft.status} />
          </div>
          <h1 className="mt-3 text-3xl font-extrabold text-[color:var(--primary)]">
            Chỉnh sửa bài viết chuyên môn
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-xl bg-white text-[color:var(--primary)] shadow-[var(--shadow-glass)]"
            tone="ghost"
          >
            <Eye size={18} />
            Xem trước
          </Button>
          <Button disabled={isPending} onClick={persist}>
            <Save size={18} />
            Lưu bài viết
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
            <FieldShell
              hint={`${draft.title.length}/100 ký tự`}
              label="Tiêu đề bài viết y khoa (H1)"
            >
              <input
                className="w-full bg-transparent text-3xl font-extrabold leading-tight text-[color:var(--primary)] outline-none placeholder:text-[color:var(--outline)]"
                onChange={(event) => patch("title", event.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
                value={draft.title}
              />
            </FieldShell>
            <div className="mt-5 rounded-xl bg-[color:var(--surface-soft)] p-4">
              <FieldShell hint="Meta lead / excerpt" label="Sa-pô mở đầu">
                <textarea
                  className="min-h-24 w-full resize-none bg-transparent text-base leading-7 text-[color:var(--text)] outline-none"
                  onChange={(event) => patch("excerpt", event.target.value)}
                  value={draft.excerpt}
                />
              </FieldShell>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
            <div className="sticky top-16 z-10 flex flex-wrap items-center gap-1.5 bg-[color:var(--surface-soft)] px-4 py-3">
              {[
                ["H2", "format_h2"],
                ["B", "format_bold"],
                ["I", "format_italic"],
                ["List", "format_list_bulleted"],
                ["Quote", "format_quote"],
                ["Callout", "medical_services"],
              ].map(([label]) => (
                <button
                  className="rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-[color:var(--primary)] hover:bg-[color:var(--ice)]"
                  key={label}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="p-6">
              <FieldShell label="Nội dung chính">
                <textarea
                  className="min-h-[520px] w-full resize-y rounded-xl border border-[color:var(--border-soft)] bg-white px-4 py-4 text-base leading-8 text-[color:var(--text)] outline-none focus:ring-2 focus:ring-[rgba(29,143,209,0.2)]"
                  onChange={(event) => patchBody(event.target.value)}
                  value={bodyText}
                />
              </FieldShell>
            </div>
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Panel icon={<ShieldCheck size={19} />} title="Quy trình duyệt 2 lớp">
            <StatusWorkflow
              currentIndex={currentStatusIndex}
              currentStatus={draft.status}
              disabled={isPending}
              onMove={moveStatus}
            />
          </Panel>

          <Panel icon={<SearchCheck size={19} />} title="OPTIQIS SEO Score">
            <div className="flex items-end gap-3">
              <div className="text-5xl font-extrabold text-[color:var(--primary)]">
                {seo.score}
              </div>
              <div className="pb-2 text-sm font-extrabold text-[color:var(--muted)]">
                /100
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[color:var(--surface-container-high)]">
              <div
                className="h-full rounded-full bg-[color:var(--secondary)]"
                style={{ width: `${seo.score}%` }}
              />
            </div>
            <div className="mt-4 space-y-3">
              <FieldShell
                hint={`${draft.seoTitle.length}/70`}
                label="Meta title"
              >
                <input
                  className="w-full rounded-lg bg-[color:var(--surface-soft)] px-3 py-2 text-sm font-semibold outline-none"
                  onChange={(event) => patch("seoTitle", event.target.value)}
                  value={draft.seoTitle}
                />
              </FieldShell>
              <FieldShell
                hint={`${draft.seoDescription.length}/160`}
                label="Meta description"
              >
                <textarea
                  className="min-h-24 w-full resize-none rounded-lg bg-[color:var(--surface-soft)] px-3 py-2 text-sm font-semibold leading-6 outline-none"
                  onChange={(event) =>
                    patch("seoDescription", event.target.value)
                  }
                  value={draft.seoDescription}
                />
              </FieldShell>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--muted)]">
              {seo.checks.map((check) => (
                <li className="flex gap-2" key={check.label}>
                  <CheckCircle2
                    className={
                      check.passed
                        ? "text-[color:var(--secondary)]"
                        : "text-amber-600"
                    }
                    size={16}
                  />
                  {check.label}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel icon={<ImageIcon size={19} />} title="Ảnh đại diện & tags">
            <div className="rounded-xl bg-[color:var(--surface-soft)] p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--primary)]">
                <ImageIcon size={17} />
                1200x630 social preview
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {draft.tags.map((tag) => (
                <span
                  className="rounded-full bg-[color:var(--ice)] px-3 py-1 text-xs font-extrabold text-[color:var(--primary)]"
                  key={tag}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </Panel>

          <Panel icon={<LinkIcon size={19} />} title="Sản phẩm liên quan">
            <div className="space-y-2">
              {products.map((product) => {
                const checked =
                  draft.relatedProducts?.some(
                    (item) => item.id === product.id,
                  ) ?? false;
                return (
                  <label
                    className="flex cursor-pointer items-center gap-3 rounded-xl bg-[color:var(--surface-soft)] p-3"
                    key={product.id}
                  >
                    <input checked={checked} readOnly type="checkbox" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold text-[color:var(--primary)]">
                        {product.name}
                      </span>
                      <span className="block truncate text-xs font-semibold text-[color:var(--muted)]">
                        {product.line} · {product.indexes.join(" / ")}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </Panel>

          <Button className="w-full" disabled={isPending} onClick={persist}>
            <Send size={18} />
            Lưu và cập nhật preview
          </Button>
          <p className="text-sm font-bold leading-6 text-[color:var(--muted)]">
            {message}
          </p>
        </aside>
      </div>
    </div>
  );
}

function StatusWorkflow({
  currentIndex,
  currentStatus,
  disabled,
  onMove,
}: {
  currentIndex: number;
  currentStatus: ArticleStatus;
  disabled: boolean;
  onMove: (status: ArticleStatus) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-full bg-[color:var(--surface-container-high)]">
        <div
          className="h-2 rounded-full bg-[linear-gradient(90deg,var(--secondary),var(--secondary-container))]"
          style={{
            width: `${((currentIndex + 1) / articleStatuses.length) * 100}%`,
          }}
        />
      </div>
      <div className="space-y-2">
        {articleStatuses.map((status, index) => {
          const isActive = currentStatus === status;
          const isComplete = index < currentIndex;
          return (
            <button
              className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                isActive
                  ? "border-[color:var(--secondary)] bg-[color:var(--ice)] shadow-[var(--shadow-glass)]"
                  : "border-[color:var(--border-soft)] bg-white hover:border-[color:var(--secondary)] hover:bg-[color:var(--surface-soft)]"
              }`}
              disabled={disabled}
              key={status}
              onClick={() => onMove(status)}
              type="button"
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                  isComplete || isActive
                    ? "bg-[color:var(--primary)] text-white"
                    : "bg-[color:var(--surface-soft)] text-[color:var(--outline)]"
                }`}
              >
                {isComplete ? <CheckCircle2 size={15} /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-[color:var(--primary)]">
                  {status}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-[color:var(--muted)]">
                  {getStatusHint(status)}
                </span>
              </span>
              {isActive ? (
                <CheckCircle2
                  size={17}
                  className="shrink-0 text-[color:var(--secondary)]"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getStatusHint(status: ArticleStatus): string {
  const hints: Record<ArticleStatus, string> = {
    DRAFT: "Đang soạn nội dung",
    PENDING_MEDICAL_REVIEW: "Chờ thẩm định y khoa",
    APPROVED: "Đủ điều kiện xuất bản",
    SCHEDULED: "Đã lên lịch phát hành",
    PUBLISHED: "Đang hiển thị public",
  };

  return hints[status];
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]">
      <div className="mb-4 flex items-center gap-2 font-extrabold text-[color:var(--primary)]">
        <span className="text-[color:var(--secondary)]">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}
