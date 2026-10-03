import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
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
import type { Article } from "@optiqis/shared";
import { ApiErrorResponseDto, ArticleResponseDto } from "../../common/api-docs.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { strictDtoPipe } from "../../common/pipes";
import { ArticlesService } from "./articles.service";
import { ListArticlesDto } from "./dto/list-articles.dto";
import { CreateArticleDto, ScheduleArticleDto, UpdateArticleDto, UpdateArticleStatusDto } from "./dto/upsert-article.dto";

@ApiTags("articles")
@Controller()
export class ArticlesController {
  constructor(@Inject(ArticlesService) private readonly articlesService: ArticlesService) {}

  @Get("articles")
  @ApiOperation({ summary: "Get list of published medical articles" })
  @ApiQuery({ name: "query", required: false, example: "cvs" })
  @ApiQuery({ name: "category", required: false, example: "CVS" })
  @ApiQuery({ name: "tag", required: false, example: "anh-sang-xanh" })
  @ApiOkResponse({ type: [ArticleResponseDto] })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  findPublished(@Query(strictDtoPipe(ListArticlesDto)) query: ListArticlesDto): Promise<Article[]> {
    return this.articlesService.findAll(query, true);
  }

  @Get("articles/:slug")
  @ApiOperation({ summary: "Get single published medical article by slug" })
  @ApiParam({ name: "slug", example: "hoi-chung-cvs-anh-sang-xanh" })
  @ApiOkResponse({ type: ArticleResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  findPublishedOne(@Param("slug") slug: string): Promise<Article> {
    return this.articlesService.findBySlug(slug, true);
  }

  @Get("admin/articles")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR", "MEDICAL_REVIEWER")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Get all articles with any status" })
  @ApiQuery({ name: "query", required: false, example: "cvs" })
  @ApiQuery({ name: "category", required: false, example: "CVS" })
  @ApiQuery({ name: "tag", required: false, example: "anh-sang-xanh" })
  @ApiQuery({ name: "status", required: false, enum: ["DRAFT", "PENDING_MEDICAL_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED"] })
  @ApiOkResponse({ type: [ArticleResponseDto] })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  findAll(@Query(strictDtoPipe(ListArticlesDto)) query: ListArticlesDto): Promise<Article[]> {
    return this.articlesService.findAll(query);
  }

  @Post("admin/articles")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Create a new draft article" })
  @ApiCreatedResponse({ type: ArticleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  create(@Body(strictDtoPipe(CreateArticleDto)) dto: CreateArticleDto): Promise<Article> {
    return this.articlesService.create(dto);
  }

  @Patch("admin/articles/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Update article details" })
  @ApiParam({ name: "id", example: "article-cvs-blue-light" })
  @ApiOkResponse({ type: ArticleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  update(@Param("id") id: string, @Body(strictDtoPipe(UpdateArticleDto)) dto: UpdateArticleDto): Promise<Article> {
    return this.articlesService.update(id, dto);
  }

  @Patch("admin/articles/:id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR", "MEDICAL_REVIEWER")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Update article status" })
  @ApiParam({ name: "id", example: "article-cvs-blue-light" })
  @ApiOkResponse({ type: ArticleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  updateStatus(@Param("id") id: string, @Body(strictDtoPipe(UpdateArticleStatusDto)) dto: UpdateArticleStatusDto): Promise<Article> {
    return this.articlesService.updateStatus(id, dto.status);
  }

  @Post("admin/articles/:id/submit-review")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[Workflow] Submit draft article for medical review" })
  @ApiParam({ name: "id", example: "article-cvs-blue-light" })
  @ApiOkResponse({ type: ArticleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  submitReview(@Param("id") id: string): Promise<Article> {
    return this.articlesService.submitReview(id);
  }

  @Post("admin/articles/:id/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "MEDICAL_REVIEWER")
  @ApiBearerAuth("demo-bearer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[Workflow] Approve article (requires independent reviewer)" })
  @ApiParam({ name: "id", example: "article-cvs-blue-light" })
  @ApiOkResponse({ type: ArticleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  approve(@Param("id") id: string): Promise<Article> {
    return this.articlesService.approve(id);
  }

  @Post("admin/articles/:id/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "MEDICAL_REVIEWER")
  @ApiBearerAuth("demo-bearer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[Workflow] Reject article back to draft" })
  @ApiParam({ name: "id", example: "article-cvs-blue-light" })
  @ApiOkResponse({ type: ArticleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  reject(@Param("id") id: string): Promise<Article> {
    return this.articlesService.reject(id);
  }

  @Post("admin/articles/:id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[Workflow] Publish approved article immediately" })
  @ApiParam({ name: "id", example: "article-cvs-blue-light" })
  @ApiOkResponse({ type: ArticleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  publish(@Param("id") id: string): Promise<Article> {
    return this.articlesService.publish(id);
  }

  @Post("admin/articles/:id/schedule")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[Workflow] Schedule approved article for publication" })
  @ApiParam({ name: "id", example: "article-cvs-blue-light" })
  @ApiOkResponse({ type: ArticleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  schedule(@Param("id") id: string, @Body(strictDtoPipe(ScheduleArticleDto)) dto: ScheduleArticleDto): Promise<Article> {
    return this.articlesService.schedule(id, dto.scheduledAt);
  }
}
