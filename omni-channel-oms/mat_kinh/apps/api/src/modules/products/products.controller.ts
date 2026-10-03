import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Product } from "@optiqis/shared";
import { ApiErrorResponseDto, DeleteResponseDto, ProductResponseDto } from "../../common/api-docs.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { strictDtoPipe } from "../../common/pipes";
import { AdjustInventoryDto } from "./dto/adjust-inventory.dto";
import { ListProductsDto } from "./dto/list-products.dto";
import { CreateProductDto, UpdateProductDto } from "./dto/upsert-product.dto";
import { ProductsService } from "./products.service";

@ApiTags("products")
@Controller()
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get("products")
  @ApiOperation({ summary: "Get list of lens products with need/index/coating filters" })
  @ApiQuery({ name: "need", required: false, example: "screen" })
  @ApiQuery({ name: "index", required: false, example: "1.67" })
  @ApiQuery({ name: "coating", required: false, example: "Nano" })
  @ApiOkResponse({ type: [ProductResponseDto] })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  findAll(@Query(strictDtoPipe(ListProductsDto)) query: ListProductsDto): Promise<Product[]> {
    return this.productsService.findAll(query);
  }

  @Get("admin/products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Get all optical lens products from OMS or local fallback" })
  @ApiOkResponse({ type: [ProductResponseDto] })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  adminFindAll(@Query(strictDtoPipe(ListProductsDto)) query: ListProductsDto): Promise<Product[]> {
    return this.productsService.findAll(query, false);
  }

  @Get("products/:slug")
  @ApiOperation({ summary: "Get single lens product by slug" })
  @ApiParam({ name: "slug", example: "digital-shield-pro" })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  findOne(@Param("slug") slug: string): Promise<Product> {
    return this.productsService.findBySlug(slug);
  }

  @Get("admin/products/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Get single optical lens product by ID" })
  @ApiParam({ name: "id", example: "product-digital-shield" })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  adminFindOne(@Param("id") id: string): Promise<Product> {
    return this.productsService.findById(id);
  }

  @Post("admin/products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Create a new optical lens product solution" })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  create(@Body(strictDtoPipe(CreateProductDto)) dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Patch("admin/products/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Update lens product solution details" })
  @ApiParam({ name: "id", example: "product-digital-shield" })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  update(@Param("id") id: string, @Body(strictDtoPipe(UpdateProductDto)) dto: UpdateProductDto): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  @Delete("admin/products/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("demo-bearer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[CMS] Delete a lens product solution" })
  @ApiParam({ name: "id", example: "product-digital-shield" })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  delete(@Param("id") id: string): Promise<{ success: boolean }> {
    return this.productsService.delete(id);
  }

  @Get("admin/products/:id/inventory")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Get OMS inventory for a product" })
  getProductInventory(@Param("id") id: string) {
    return this.productsService.getInventoryByProduct(id);
  }

  @Get("admin/warehouses")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Get OMS warehouses" })
  getWarehouses() {
    return this.productsService.getWarehouses();
  }

  @Post("admin/inventory/adjust")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Adjust OMS inventory" })
  adjustInventory(@Body(strictDtoPipe(AdjustInventoryDto)) body: AdjustInventoryDto) {
    return this.productsService.adjustInventory(body);
  }
}
