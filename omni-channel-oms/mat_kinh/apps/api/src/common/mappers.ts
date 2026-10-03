import type { Article, ArticleBlock, ConsultationLead, Product, ProductSpecs } from "@optiqis/shared";
import type {
  Article as DbArticle,
  ConsultationLead as DbConsultationLead,
  MedicalExpert,
  Product as DbProduct,
} from "@prisma/client";

export function productFromDb(product: DbProduct): Product {
  return {
    ...product,
    specsJson: product.specsJson as unknown as ProductSpecs,
  };
}

export function articleFromDb(
  article: DbArticle & {
    author?: MedicalExpert;
    reviewer?: MedicalExpert;
    relatedProducts?: { product: DbProduct }[];
  },
): Article {
  return {
    ...article,
    contentJson: article.contentJson as unknown as ArticleBlock[],
    publishedAt: article.publishedAt?.toISOString() ?? null,
    scheduledAt: article.scheduledAt?.toISOString() ?? null,
    author: article.author,
    reviewer: article.reviewer,
    relatedProducts: article.relatedProducts?.map((link) => productFromDb(link.product)),
  };
}

export function consultationLeadFromDb(lead: DbConsultationLead): ConsultationLead {
  return {
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}
