import { describe, expect, it } from "vitest";
import { mapOmsMasterSkuToProduct, mapProductToOmsCreateInput } from "./oms.mapper";

describe("OMS product mapper", () => {
  it("maps OMS master SKU and optical metadata into a public OPTIQIS product", () => {
    const product = mapOmsMasterSkuToProduct({
      id: "sku-1",
      skuCode: "DIGITAL-SHIELD-PRO",
      productName: "OPTIQIS Digital Shield Pro",
      categoryName: "Digital Shield",
      publicMetadata: {
        slug: "digital-shield-pro",
        summary: "Tròng kính lọc ánh sáng xanh chọn lọc.",
        needs: ["screen"],
        indexes: ["1.60"],
        coatings: ["Nano"],
        technologies: ["Selective Wave Filtering"],
        heroImage: "https://example.com/hero.jpg",
        specsJson: {
          abbe: "32",
          uvProtection: "UV400",
          recommendedFor: ["Dân văn phòng"],
          wavelength: {
            adverse: "415-455nm",
            beneficial: "465-495nm",
            claim: "Giảm HEV có hại",
          },
        },
        isFeatured: true,
      },
    });

    expect(product).toMatchObject({
      id: "sku-1",
      slug: "digital-shield-pro",
      name: "OPTIQIS Digital Shield Pro",
      line: "Digital Shield",
      isFeatured: true,
    });
    expect(product.specsJson.wavelength.adverse).toBe("415-455nm");
  });

  it("converts a CMS product draft into OMS create input", () => {
    const input = mapProductToOmsCreateInput({
      slug: "digital-shield-pro",
      name: "OPTIQIS Digital Shield Pro",
      line: "Digital Shield",
      summary: "Tròng kính lọc ánh sáng xanh chọn lọc.",
      needs: ["screen"],
      indexes: ["1.60"],
      coatings: ["Nano"],
      technologies: ["Selective Wave Filtering"],
      heroImage: "https://example.com/hero.jpg",
      specsJson: {
        abbe: "32",
        uvProtection: "UV400",
        recommendedFor: ["Dân văn phòng"],
        wavelength: {
          adverse: "415-455nm",
          beneficial: "465-495nm",
          claim: "Giảm HEV có hại",
        },
      },
      isFeatured: true,
    });

    expect(input.skuCode).toBe("DIGITAL-SHIELD-PRO");
    expect(input.productName).toBe("OPTIQIS Digital Shield Pro");
    expect(input.categoryName).toBe("Digital Shield");
    expect(input.publicMetadata.slug).toBe("digital-shield-pro");
  });
});
