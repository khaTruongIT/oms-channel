import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { articleStatuses, type ArticleBlock, type ArticleStatus } from "@optiqis/shared";
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ArticleBlockDto implements ArticleBlock {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty({ enum: ["heading", "paragraph", "callout", "reference"] })
  @IsIn(["heading", "paragraph", "callout", "reference"])
  type!: "heading" | "paragraph" | "callout" | "reference";

  @ApiProperty()
  @IsString()
  text!: string;
}

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  excerpt!: string;

  @ApiProperty({ type: [ArticleBlockDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleBlockDto)
  contentJson!: ArticleBlockDto[];

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @ApiProperty({ enum: articleStatuses })
  @IsIn(articleStatuses)
  status!: ArticleStatus;

  @ApiProperty()
  @IsString()
  seoTitle!: string;

  @ApiProperty()
  @IsString()
  seoDescription!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100)
  seoScore!: number;

  @ApiProperty()
  @IsString()
  authorId!: string;

  @ApiProperty()
  @IsString()
  reviewerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publishedAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduledAt?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedProductIds?: string[];
}

export class UpdateArticleDto extends PartialType(CreateArticleDto) {}

export class UpdateArticleStatusDto {
  @ApiProperty({ enum: articleStatuses })
  @IsIn(articleStatuses)
  status!: ArticleStatus;
}

export class ScheduleArticleDto {
  @ApiPropertyOptional({
    description: "Optional ISO timestamp. Defaults to 24 hours from now when omitted.",
    example: "2026-10-01T09:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
