import type { Product, ProductSpecs } from "@optiqis/shared";
import type { CreateProductDto, UpdateProductDto } from "../products/dto/upsert-product.dto";
import type { OmsMasterSku, OmsProductCreateInput, OmsProductUpdateInput } from "./oms.types";

const defaultSpecs: ProductSpecs = {
  abbe: "N/A",
  uvProtection: "UV400",
  recommendedFor: [],
  wavelength: {
    adverse: "N/A",
    beneficial: "N/A",
    claim: "Thông tin đang được cập nhật",
  },
};

function slugFromSku(skuCode: string): string {
  return skuCode
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function productMetadata(dto: CreateProductDto | UpdateProductDto): Omit<Product, "id" | "name" | "line"> {
  return {
    slug: dto.slug ?? "",
    summary: dto.summary ?? "",
    needs: dto.needs ?? [],
    indexes: dto.indexes ?? [],
    coatings: dto.coatings ?? [],
    technologies: dto.technologies ?? [],
    heroImage: dto.heroImage ?? "",
    specsJson: dto.specsJson ?? defaultSpecs,
    isFeatured: dto.isFeatured ?? false,
  };
}

export function mapOmsMasterSkuToProduct(masterSku: OmsMasterSku): Product {
  const metadata = masterSku.publicMetadata ?? {};

  return {
    id: masterSku.id,
    slug: typeof metadata.slug === "string" && metadata.slug ? metadata.slug : slugFromSku(masterSku.skuCode),
    name: masterSku.productName,
    line:
      masterSku.categoryName ??
      (typeof metadata.line === "string" ? metadata.line : "OPTIQIS"),
    summary: typeof metadata.summary === "string" ? metadata.summary : masterSku.productName,
    needs: stringArray(metadata.needs),
    indexes: stringArray(metadata.indexes),
    coatings: stringArray(metadata.coatings),
    technologies: stringArray(metadata.technologies),
    heroImage: typeof metadata.heroImage === "string" ? metadata.heroImage : "",
    specsJson:
      metadata.specsJson && typeof metadata.specsJson === "object"
        ? (metadata.specsJson as ProductSpecs)
        : defaultSpecs,
    isFeatured: typeof metadata.isFeatured === "boolean" ? metadata.isFeatured : false,
  };
}

export function mapProductToOmsCreateInput(dto: CreateProductDto): OmsProductCreateInput {
  return {
    skuCode: dto.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    productName: dto.name,
    categoryName: dto.line,
    publicMetadata: productMetadata(dto),
  };
}

export function mapProductToOmsUpdateInput(dto: UpdateProductDto): OmsProductUpdateInput {
  return {
    ...(dto.name ? { productName: dto.name } : {}),
    ...(dto.line ? { categoryName: dto.line } : {}),
    ...(Object.keys(dto).length > 0 ? { publicMetadata: productMetadata(dto) } : {}),
  };
}
