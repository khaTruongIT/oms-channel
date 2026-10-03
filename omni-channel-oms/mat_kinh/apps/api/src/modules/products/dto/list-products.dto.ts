import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ListProductsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  need?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  index?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coating?: string;
}
