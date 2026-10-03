import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { ArticlesService } from "./articles.service";
import type { PrismaService } from "../../prisma/prisma.service";

const prisma = { client: null } satisfies Pick<PrismaService, "client">;

describe("ArticlesService", () => {
  it("rejects invalid status transitions", async () => {
    const service = new ArticlesService(prisma as PrismaService);

    await expect(
      service.updateStatus("article-dims", "SCHEDULED"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns only published articles for public listing", async () => {
    const service = new ArticlesService(prisma as PrismaService);
    const articles = await service.findAll({}, true);

    expect(articles.every((article) => article.status === "PUBLISHED")).toBe(true);
  });

  it("enforces independent medical review check (author !== reviewer) on approval", async () => {
    const service = new ArticlesService(prisma as PrismaService);

    // Create an article where authorId === reviewerId
    const draft = await service.create({
      slug: "self-authored-test",
      title: "Self Authored Medical Test",
      excerpt: "Test excerpt",
      contentJson: [],
      category: "CVS",
      tags: ["test"],
      status: "PENDING_MEDICAL_REVIEW",
      seoTitle: "SEO Test Title",
      seoDescription: "SEO Test Meta Description",
      seoScore: 85,
      authorId: "expert-hoang-nam",
      reviewerId: "expert-hoang-nam", // Same as author!
    });

    await expect(service.approve(draft.id)).rejects.toThrow(
      "Independent medical review required: Article author cannot approve their own medical content."
    );
  });
});

