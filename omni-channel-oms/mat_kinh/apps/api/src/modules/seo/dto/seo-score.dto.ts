import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";
import type { SeoInput } from "@optiqis/shared";

export class SeoScoreDto implements SeoInput {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  seoTitle!: string;

  @ApiProperty()
  @IsString()
  seoDescription!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedProductIds?: string[];
}
