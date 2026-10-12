import { IsNotEmpty, IsString, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Order status',
    example: 'CONFIRMED',
    enum: [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ])
  status: string;

  @ApiPropertyOptional({
    description: 'Reason for status update, mandatory when status is CANCELLED',
    example: 'Customer requested cancellation',
  })
  @ValidateIf((o) => o.status === 'CANCELLED')
  @IsNotEmpty({ message: 'reason is required when cancelling an order' })
  @IsString()
  reason?: string;
}
