import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search keyword (minimum 2 characters)',
    example: 'ORD-123',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'q must be at least 2 characters' })
  q: string;

  @ApiPropertyOptional({
    description: 'Comma-separated entity types: products, orders, customers',
    example: 'products,orders,customers',
  })
  @IsOptional()
  @IsString()
  types?: string;
}
