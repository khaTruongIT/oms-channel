"use server";

import type { Article } from "@optiqis/shared";
import {
  saveArticle as saveArticleToApi,
  updateArticleStatus as updateArticleStatusInApi,
} from "@/lib/api";

export async function saveArticleAction(
  id: string,
  article: Partial<Article>,
): Promise<Article> {
  return saveArticleToApi(id, article);
}

export async function updateArticleStatusAction(
  id: string,
  status: Article["status"],
): Promise<Article> {
  return updateArticleStatusInApi(id, status);
}
