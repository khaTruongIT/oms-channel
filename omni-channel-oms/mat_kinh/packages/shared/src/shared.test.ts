import { describe, expect, it } from "vitest";
import { articles, clinics, products } from "./seed";
import { filterArticles, filterClinics, filterProducts } from "./filters";
import { scoreSeo } from "./seo";
import { canTransitionArticle } from "./workflow";

describe("shared domain helpers", () => {
  it("filters products by need and index", () => {
    const result = filterProducts(products, { need: "screen", index: "1.67" });

    expect(result.map((item) => item.slug)).toEqual(["digital-shield-pro"]);
  });

  it("filters clinics by province and district", () => {
    const result = filterClinics(clinics, {
      province: "TP. Ho Chi Minh",
      district: "Quan 1",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toContain("Quan 1");
  });

  it("keeps draft articles hidden when caller requests published", () => {
    const result = filterArticles(articles, { status: "PUBLISHED" });

    expect(result.every((item) => item.status === "PUBLISHED")).toBe(true);
  });

  it("scores SEO checks predictably", () => {
    const result = scoreSeo({
      title: "Hoi chung thi giac man hinh va anh sang xanh",
      seoTitle: "Hoi chung CVS va anh sang xanh | OPTIQIS",
      seoDescription:
        "Tim hieu hoi chung thi giac man hinh, quy tac 20-20-20 va cac giai phap trong kinh loc quang pho co chon loc cho nguoi lam viec dai gio.",
      slug: "hoi-chung-cvs-anh-sang-xanh",
      category: "CVS",
      relatedProductIds: ["product-digital-shield"],
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("rejects invalid medical approval jumps", () => {
    expect(canTransitionArticle("DRAFT", "PUBLISHED")).toBe(false);
    expect(canTransitionArticle("APPROVED", "PUBLISHED")).toBe(true);
  });
});
