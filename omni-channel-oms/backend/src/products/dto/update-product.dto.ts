import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductPublicMetadataDto } from './product-public-metadata.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Updated product name',
    example: 'Premium T-Shirt Updated',
  })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({
    description: 'Updated product variants',
    example: [{ size: 'L', color: 'Red' }],
  })
  @IsOptional()
  @IsArray()
  variants?: Record<string, any>[];

  @ApiPropertyOptional({
    description: 'Updated cost price',
    example: 34.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Updated category ID',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Updated category name (creates the category when missing)',
    example: 'Digital Shield',
  })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional({
    description: 'Updated public optical/SEO metadata used by the mat_kinh storefront',
    type: ProductPublicMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductPublicMetadataDto)
  publicMetadata?: ProductPublicMetadataDto;
}
