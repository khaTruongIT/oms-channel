import { Inject, Injectable, NotFoundException, Optional, ServiceUnavailableException } from "@nestjs/common";
import { filterProducts, products, type Product } from "@optiqis/shared";
import { productFromDb } from "../../common/mappers";
import { PrismaService } from "../../prisma/prisma.service";
import { OmsClient } from "../oms/oms.client";
import { mapOmsMasterSkuToProduct, mapProductToOmsCreateInput, mapProductToOmsUpdateInput } from "../oms/oms.mapper";
import type { OmsAdjustInventoryInput, OmsInventoryItem, OmsWarehouse } from "../oms/oms.types";
import type { ListProductsDto } from "./dto/list-products.dto";
import type { CreateProductDto, UpdateProductDto } from "./dto/upsert-product.dto";

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(OmsClient) private readonly omsClient?: OmsClient,
  ) {}

  async findAll(query: ListProductsDto, allowFallback = true): Promise<Product[]> {
    if (this.omsClient?.isEnabled()) {
      try {
        const items = await this.omsClient.getProducts();
        return filterProducts(items.map(mapOmsMasterSkuToProduct), query);
      } catch (error) {
        if (!allowFallback) {
          throw error;
        }
      }
    }

    if (!this.prisma.client) {
      return filterProducts(products, query);
    }

    const items = await this.prisma.client.product.findMany({
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    });

    return filterProducts(items.map(productFromDb), query);
  }

  async findBySlug(slug: string): Promise<Product> {
    const fallback = products.find((product) => product.slug === slug);

    if (this.omsClient?.isEnabled()) {
      try {
        const items = await this.omsClient.getProducts();
        const product = items.map(mapOmsMasterSkuToProduct).find((item) => item.slug === slug || item.id === slug);
        if (product) return product;
      } catch {
        // Public storefront can continue with local demo content when OMS is down.
      }
    }

    if (!this.prisma.client) {
      if (!fallback) {
        throw new NotFoundException("Product not found");
      }
      return fallback;
    }

    const product = await this.prisma.client.product.findUnique({ where: { slug } });
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return productFromDb(product);
  }

  async findById(id: string): Promise<Product> {
    if (this.omsClient?.isEnabled()) {
      const product = await this.omsClient.getProduct(id);
      return mapOmsMasterSkuToProduct(product);
    }

    const product = products.find((item) => item.id === id);
    if (!this.prisma.client) {
      if (!product) {
        throw new NotFoundException("Product not found");
      }
      return product;
    }

    const dbProduct = await this.prisma.client.product.findUnique({ where: { id } });
    if (!dbProduct) {
      throw new NotFoundException("Product not found");
    }
    return productFromDb(dbProduct);
  }

  async create(dto: CreateProductDto): Promise<Product> {
    if (this.omsClient?.isEnabled()) {
      const created = await this.omsClient.createProduct(mapProductToOmsCreateInput(dto));
      return mapOmsMasterSkuToProduct(created);
    }

    const newProduct: Product = {
      id: `product-${Date.now()}`,
      slug: dto.slug,
      name: dto.name,
      line: dto.line,
      summary: dto.summary,
      needs: dto.needs,
      indexes: dto.indexes,
      coatings: dto.coatings,
      technologies: dto.technologies,
      heroImage: dto.heroImage,
      specsJson: dto.specsJson,
      isFeatured: dto.isFeatured ?? false,
    };

    if (!this.prisma.client) {
      products.unshift(newProduct);
      return newProduct;
    }

    const created = await this.prisma.client.product.create({
      data: {
        ...newProduct,
        specsJson: dto.specsJson as unknown as import("@prisma/client").Prisma.InputJsonValue,
      },
    });

    return productFromDb(created);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (this.omsClient?.isEnabled()) {
      const current = await this.findById(id);
      const merged: UpdateProductDto = {
        slug: dto.slug ?? current.slug,
        name: dto.name ?? current.name,
        line: dto.line ?? current.line,
        summary: dto.summary ?? current.summary,
        needs: dto.needs ?? current.needs,
        indexes: dto.indexes ?? current.indexes,
        coatings: dto.coatings ?? current.coatings,
        technologies: dto.technologies ?? current.technologies,
        heroImage: dto.heroImage ?? current.heroImage,
        specsJson: dto.specsJson ?? current.specsJson,
        isFeatured: dto.isFeatured ?? current.isFeatured,
      };
      const updated = await this.omsClient.updateProduct(id, mapProductToOmsUpdateInput(merged));
      return mapOmsMasterSkuToProduct(updated);
    }

    const existingIndex = products.findIndex((p) => p.id === id);

    if (!this.prisma.client) {
      if (existingIndex < 0) throw new NotFoundException("Product not found");
      const updated = { ...products[existingIndex], ...dto } as Product;
      products[existingIndex] = updated;
      return updated;
    }

    const updated = await this.prisma.client.product.update({
      where: { id },
      data: {
        ...(dto.slug ? { slug: dto.slug } : {}),
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.line ? { line: dto.line } : {}),
        ...(dto.summary ? { summary: dto.summary } : {}),
        ...(dto.needs ? { needs: dto.needs } : {}),
        ...(dto.indexes ? { indexes: dto.indexes } : {}),
        ...(dto.coatings ? { coatings: dto.coatings } : {}),
        ...(dto.technologies ? { technologies: dto.technologies } : {}),
        ...(dto.heroImage ? { heroImage: dto.heroImage } : {}),
        ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
        ...(dto.specsJson
          ? { specsJson: dto.specsJson as unknown as import("@prisma/client").Prisma.InputJsonValue }
          : {}),
      },
    });

    return productFromDb(updated);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const index = products.findIndex((p) => p.id === id);

    if (!this.prisma.client) {
      if (index >= 0) products.splice(index, 1);
      return { success: true };
    }

    await this.prisma.client.product.delete({ where: { id } });
    return { success: true };
  }

  async getInventoryByProduct(id: string): Promise<OmsInventoryItem[]> {
    if (!this.omsClient?.isEnabled()) {
      return [];
    }

    return this.omsClient.getInventoryByProduct(id);
  }

  async getWarehouses(): Promise<OmsWarehouse[]> {
    if (!this.omsClient?.isEnabled()) {
      return [];
    }

    return this.omsClient.getWarehouses();
  }

  async adjustInventory(input: OmsAdjustInventoryInput): Promise<OmsInventoryItem> {
    if (!this.omsClient?.isEnabled()) {
      throw new ServiceUnavailableException("OMS integration is disabled");
    }

    return this.omsClient.adjustInventory(input);
  }
}
