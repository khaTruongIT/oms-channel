import { Prisma, PrismaClient } from "@prisma/client";
import { articles, clinics, experts, products, type Article, type Product } from "@optiqis/shared";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  for (const expert of experts) {
    await prisma.medicalExpert.upsert({
      where: { id: expert.id },
      update: expert,
      create: expert,
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: productData(product),
      create: productData(product),
    });
  }

  for (const article of articles) {
    const relatedProducts = article.relatedProducts ?? [];

    await prisma.article.upsert({
      where: { id: article.id },
      update: {
        ...articleScalarData(article),
        relatedProducts: {
          deleteMany: {},
          create: relatedProducts.map((product) => ({
            product: { connect: { id: product.id } },
          })),
        },
      },
      create: {
        ...articleCreateData(article),
        relatedProducts: {
          create: relatedProducts.map((product) => ({
            product: { connect: { id: product.id } },
          })),
        },
      },
    });
  }

  for (const clinic of clinics) {
    await prisma.clinic.upsert({
      where: { id: clinic.id },
      update: clinic,
      create: clinic,
    });
  }
}

function articleScalarData(article: Article): Prisma.ArticleUncheckedUpdateInput {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    contentJson: article.contentJson as unknown as Prisma.InputJsonValue,
    category: article.category,
    tags: article.tags,
    status: article.status,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    seoScore: article.seoScore,
    authorId: article.authorId,
    reviewerId: article.reviewerId,
    publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
    scheduledAt: article.scheduledAt ? new Date(article.scheduledAt) : null,
  };
}

function articleCreateData(article: Article): Prisma.ArticleUncheckedCreateWithoutRelatedProductsInput {
  return articleScalarData(article) as Prisma.ArticleUncheckedCreateWithoutRelatedProductsInput;
}

function productData(product: Product): Prisma.ProductUncheckedCreateInput {
  return {
    ...product,
    specsJson: product.specsJson as unknown as Prisma.InputJsonValue,
  };
}

main()
  .then(() => {
    console.log("OPTIQIS demo database seeded.");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
