import {
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const VALID_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatusFilter = (typeof VALID_ORDER_STATUSES)[number];

export class GetOrdersQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page (max 100)',
    example: 25,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Free-text search query across order number, external order ID, customer name',
    example: 'ORD-123',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Created date from (ISO 8601)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Created date to (ISO 8601)',
    example: '2026-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description:
      'Sort by field and direction, e.g. createdAt:desc, totalAmount:asc',
    example: 'createdAt:desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Filter by channel',
    example: 'SHOPEE',
  })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: VALID_ORDER_STATUSES,
    example: 'PENDING',
  })
  @IsOptional()
  @IsIn(VALID_ORDER_STATUSES, {
    message: 'status must be a valid order status',
  })
  status?: OrderStatusFilter;

  @ApiPropertyOptional({
    description: 'Filter by external marketplace order ID',
    example: 'SHOPEE-999',
  })
  @IsOptional()
  @IsString()
  externalOrderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by channel account UUID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsOptional()
  @IsUUID('4', {
    message: 'channelAccountId must be a valid UUID',
  })
  channelAccountId?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsOptional()
  @IsUUID('4', {
    message: 'customerId must be a valid UUID',
  })
  customerId?: string;
}
