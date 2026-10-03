import { ApiPropertyOptional } from "@nestjs/swagger";
import { articleStatuses } from "@optiqis/shared";
import { IsIn, IsOptional, IsString } from "class-validator";
import type { ArticleStatus } from "@optiqis/shared";

export class ListArticlesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ enum: articleStatuses })
  @IsOptional()
  @IsIn(articleStatuses)
  status?: ArticleStatus;
}
