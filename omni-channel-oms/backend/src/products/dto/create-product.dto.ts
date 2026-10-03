import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductPublicMetadataDto } from './product-public-metadata.dto';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product SKU code',
    example: 'SKU-12345',
  })
  @IsNotEmpty()
  @IsString()
  skuCode: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Premium T-Shirt',
  })
  @IsNotEmpty()
  @IsString()
  productName: string;

  @ApiPropertyOptional({
    description: 'Product variants',
    example: [{ size: 'M', color: 'Blue' }],
  })
  @IsOptional()
  @IsArray()
  variants?: Record<string, any>[];

  @ApiPropertyOptional({
    description: 'Product cost price',
    example: 29.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Category name (to create new category on the fly)',
    example: 'Electronics',
  })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional({
    description: 'Public optical/SEO metadata used by the mat_kinh storefront',
    type: ProductPublicMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductPublicMetadataDto)
  publicMetadata?: ProductPublicMetadataDto;
}
