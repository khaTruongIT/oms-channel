import type { ArticleStatus } from "./types";

const allowedTransitions: Record<ArticleStatus, ArticleStatus[]> = {
  DRAFT: ["PENDING_MEDICAL_REVIEW"],
  PENDING_MEDICAL_REVIEW: ["APPROVED", "DRAFT"],
  APPROVED: ["SCHEDULED", "PUBLISHED"],
  SCHEDULED: ["PUBLISHED", "DRAFT"],
  PUBLISHED: ["DRAFT"],
};

export function canTransitionArticle(
  from: ArticleStatus,
  to: ArticleStatus,
): boolean {
  if (from === to) {
    return true;
  }

  return allowedTransitions[from].includes(to);
}

export function assertArticleTransition(
  from: ArticleStatus,
  to: ArticleStatus,
): void {
  if (!canTransitionArticle(from, to)) {
    throw new Error(`Invalid article status transition from ${from} to ${to}`);
  }
}
