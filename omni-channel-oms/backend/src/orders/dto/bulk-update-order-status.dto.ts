import {
  IsArray,
  ArrayNotEmpty,
  ArrayMaxSize,
  IsUUID,
  IsNotEmpty,
  IsString,
  IsIn,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VALID_ORDER_STATUSES } from './get-orders-query.dto';

export class BulkUpdateOrderStatusDto {
  @ApiProperty({
    description: 'List of order UUIDs to update (max 100)',
    example: ['11111111-1111-1111-1111-111111111111'],
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Order IDs array cannot be empty' })
  @ArrayMaxSize(100, {
    message: 'Cannot process more than 100 orders in a single bulk operation',
  })
  @IsUUID('all', { each: true, message: 'Each order ID must be a valid UUID' })
  ids: string[];

  @ApiProperty({
    description: 'Target order status',
    example: 'CONFIRMED',
    enum: VALID_ORDER_STATUSES,
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(VALID_ORDER_STATUSES, {
    message: 'status must be a valid order status',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Reason for status update (mandatory when status is CANCELLED)',
    example: 'Bulk cancellation due to supplier delay',
  })
  @ValidateIf((o) => o.status === 'CANCELLED')
  @IsNotEmpty({
    message: 'reason is required when cancelling orders in bulk',
  })
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Client-provided idempotency key',
    example: 'bulk-cancel-20261012-001',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
