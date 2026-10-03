import type { ArticleStatus } from "@optiqis/shared";

const labels: Record<ArticleStatus, string> = {
  DRAFT: "Ban nhap",
  PENDING_MEDICAL_REVIEW: "Cho duyet y khoa",
  APPROVED: "Da phe duyet",
  SCHEDULED: "Len lich",
  PUBLISHED: "Xuat ban",
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const tone =
    status === "PUBLISHED"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-[color:var(--ice)] text-[color:var(--primary)]";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${tone}`}
    >
      {labels[status]}
    </span>
  );
}
