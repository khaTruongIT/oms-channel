import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  articles,
  assertArticleTransition,
  experts,
  filterArticles,
  products,
  type Article,
} from "@optiqis/shared";
import { articleFromDb } from "../../common/mappers";
import { PrismaService } from "../../prisma/prisma.service";
import type { ListArticlesDto } from "./dto/list-articles.dto";
import type { CreateArticleDto, UpdateArticleDto } from "./dto/upsert-article.dto";

@Injectable()
export class ArticlesService {
  private readonly memoryArticles: Article[] = articles;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(query: ListArticlesDto, publicOnly = false): Promise<Article[]> {
    const status = publicOnly ? "PUBLISHED" : query.status;
    if (!this.prisma.client) {
      return filterArticles(this.memoryArticles.map(hydrateArticle), { ...query, status });
    }

    const items = await this.prisma.client.article.findMany({
      include: articleInclude,
      orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
    });

    return filterArticles(items.map(articleFromDb), { ...query, status });
  }

  async findBySlug(slug: string, publicOnly = false): Promise<Article> {
    const article = await this.findArticleBySlug(slug);
    if (publicOnly && article.status !== "PUBLISHED") {
      throw new NotFoundException("Article not found");
    }
    return article;
  }

  async create(dto: CreateArticleDto): Promise<Article> {
    if (!this.prisma.client) {
      const article = hydrateArticle({
        id: `article-${Date.now()}`,
        slug: dto.slug,
        title: dto.title,
        excerpt: dto.excerpt,
        contentJson: dto.contentJson,
        category: dto.category,
        tags: dto.tags,
        status: dto.status,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        seoScore: dto.seoScore,
        authorId: dto.authorId,
        reviewerId: dto.reviewerId,
        publishedAt: dto.publishedAt ?? null,
        scheduledAt: dto.scheduledAt ?? null,
        relatedProducts: products.filter((product) => dto.relatedProductIds?.includes(product.id)),
      });
      this.memoryArticles.unshift(article);
      return article;
    }

    const article = await this.prisma.client.article.create({
      data: articleCreateData(dto),
      include: articleInclude,
    });

    return articleFromDb(article);
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    if (!this.prisma.client) {
      return this.updateMemoryArticle(id, dto);
    }

    const article = await this.prisma.client.article.update({
      where: { id },
      data: articleUpdateData(dto),
      include: articleInclude,
    });

    return articleFromDb(article);
  }

  async updateStatus(id: string, status: Article["status"]): Promise<Article> {
    const article = await this.findById(id);
    try {
      assertArticleTransition(article.status, status);
    } catch (error: unknown) {
      throw new BadRequestException(error instanceof Error ? error.message : "Invalid status");
    }

    if (status === "APPROVED" && article.authorId === article.reviewerId) {
      throw new BadRequestException(
        "Independent medical review required: Article author cannot approve their own medical content."
      );
    }

    return this.update(id, {
      status,
      publishedAt: status === "PUBLISHED" ? new Date().toISOString() : article.publishedAt,
    });
  }

  async submitReview(id: string): Promise<Article> {
    return this.updateStatus(id, "PENDING_MEDICAL_REVIEW");
  }

  async approve(id: string): Promise<Article> {
    return this.updateStatus(id, "APPROVED");
  }

  async reject(id: string): Promise<Article> {
    return this.updateStatus(id, "DRAFT");
  }

  async publish(id: string): Promise<Article> {
    return this.updateStatus(id, "PUBLISHED");
  }

  async schedule(id: string, scheduledAt?: string): Promise<Article> {
    const article = await this.findById(id);
    try {
      assertArticleTransition(article.status, "SCHEDULED");
    } catch (error: unknown) {
      throw new BadRequestException(error instanceof Error ? error.message : "Invalid status");
    }

    return this.update(id, {
      status: "SCHEDULED",
      scheduledAt: scheduledAt ?? new Date(Date.now() + 86400000).toISOString(),
    });
  }


  private async findById(id: string): Promise<Article> {
    if (!this.prisma.client) {
      const article = this.memoryArticles.find((item) => item.id === id);
      if (!article) throw new NotFoundException("Article not found");
      return hydrateArticle(article);
    }

    const article = await this.prisma.client.article.findUnique({ where: { id }, include: articleInclude });
    if (!article) throw new NotFoundException("Article not found");
    return articleFromDb(article);
  }

  private async findArticleBySlug(slug: string): Promise<Article> {
    if (!this.prisma.client) {
      const article = this.memoryArticles.find((item) => item.slug === slug);
      if (!article) throw new NotFoundException("Article not found");
      return hydrateArticle(article);
    }

    const article = await this.prisma.client.article.findUnique({ where: { slug }, include: articleInclude });
    if (!article) throw new NotFoundException("Article not found");
    return articleFromDb(article);
  }

  private updateMemoryArticle(id: string, dto: UpdateArticleDto): Article {
    const index = this.memoryArticles.findIndex((article) => article.id === id);
    if (index < 0) throw new NotFoundException("Article not found");

    const current = this.memoryArticles[index];
    if (!current) throw new NotFoundException("Article not found");

    const relatedProducts = dto.relatedProductIds
      ? products.filter((product) => dto.relatedProductIds?.includes(product.id))
      : current.relatedProducts;
    const updated = hydrateArticle({ ...current, ...definedArticlePatch(dto), id, relatedProducts });
    this.memoryArticles[index] = updated;
    return updated;
  }
}

const articleInclude = {
  author: true,
  reviewer: true,
  relatedProducts: { include: { product: true } },
} as const;

function hydrateArticle(article: Omit<Article, "author" | "reviewer">): Article {
  return {
    ...article,
    author: experts.find((expert) => expert.id === article.authorId),
    reviewer: experts.find((expert) => expert.id === article.reviewerId),
    relatedProducts:
      article.relatedProducts ??
      products.filter((product) => article.relatedProducts?.some((related) => related.id === product.id)),
  };
}

function relatedProductsWrite(productIds: string[] | undefined): {
  create: { product: { connect: { id: string } } }[];
} {
  return {
    create: (productIds ?? []).map((id) => ({ product: { connect: { id } } })),
  };
}

function articleCreateData(dto: CreateArticleDto): Prisma.ArticleCreateInput {
  return {
    id: `article-${Date.now()}`,
    slug: dto.slug,
    title: dto.title,
    excerpt: dto.excerpt,
    contentJson: dto.contentJson as unknown as Prisma.InputJsonValue,
    category: dto.category,
    tags: dto.tags,
    status: dto.status,
    seoTitle: dto.seoTitle,
    seoDescription: dto.seoDescription,
    seoScore: dto.seoScore,
    publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
    scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
    author: { connect: { id: dto.authorId } },
    reviewer: { connect: { id: dto.reviewerId } },
    relatedProducts: relatedProductsWrite(dto.relatedProductIds),
  };
}

function articleUpdateData(dto: UpdateArticleDto): Prisma.ArticleUpdateInput {
  return {
    ...(dto.slug ? { slug: dto.slug } : {}),
    ...(dto.title ? { title: dto.title } : {}),
    ...(dto.excerpt ? { excerpt: dto.excerpt } : {}),
    ...(dto.contentJson
      ? { contentJson: dto.contentJson as unknown as Prisma.InputJsonValue }
      : {}),
    ...(dto.category ? { category: dto.category } : {}),
    ...(dto.tags ? { tags: dto.tags } : {}),
    ...(dto.status ? { status: dto.status } : {}),
    ...(dto.seoTitle ? { seoTitle: dto.seoTitle } : {}),
    ...(dto.seoDescription ? { seoDescription: dto.seoDescription } : {}),
    ...(dto.seoScore !== undefined ? { seoScore: dto.seoScore } : {}),
    ...(dto.publishedAt !== undefined
      ? { publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null }
      : {}),
    ...(dto.scheduledAt !== undefined
      ? { scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null }
      : {}),
    ...(dto.authorId ? { author: { connect: { id: dto.authorId } } } : {}),
    ...(dto.reviewerId ? { reviewer: { connect: { id: dto.reviewerId } } } : {}),
    ...(dto.relatedProductIds
      ? { relatedProducts: { deleteMany: {}, ...relatedProductsWrite(dto.relatedProductIds) } }
      : {}),
  };
}

function definedArticlePatch(dto: UpdateArticleDto): Partial<Omit<Article, "author" | "reviewer">> {
  const patch: Partial<Omit<Article, "author" | "reviewer">> = {};
  if (dto.slug !== undefined) patch.slug = dto.slug;
  if (dto.title !== undefined) patch.title = dto.title;
  if (dto.excerpt !== undefined) patch.excerpt = dto.excerpt;
  if (dto.contentJson !== undefined) patch.contentJson = dto.contentJson;
  if (dto.category !== undefined) patch.category = dto.category;
  if (dto.tags !== undefined) patch.tags = dto.tags;
  if (dto.status !== undefined) patch.status = dto.status;
  if (dto.seoTitle !== undefined) patch.seoTitle = dto.seoTitle;
  if (dto.seoDescription !== undefined) patch.seoDescription = dto.seoDescription;
  if (dto.seoScore !== undefined) patch.seoScore = dto.seoScore;
  if (dto.authorId !== undefined) patch.authorId = dto.authorId;
  if (dto.reviewerId !== undefined) patch.reviewerId = dto.reviewerId;
  if (dto.publishedAt !== undefined) patch.publishedAt = dto.publishedAt;
  if (dto.scheduledAt !== undefined) patch.scheduledAt = dto.scheduledAt;
  return patch;
}
