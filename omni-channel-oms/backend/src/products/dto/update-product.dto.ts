import { IsOptional, IsString, IsNumber, IsArray, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
}
