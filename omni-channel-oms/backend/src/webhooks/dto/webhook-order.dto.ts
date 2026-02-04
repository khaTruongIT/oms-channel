import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookOrderDto {
  @ApiProperty({
    description: 'Sales channel name',
    example: 'shopee',
    enum: ['shopee', 'tiktok', 'lazada'],
  })
  @IsNotEmpty()
  @IsString()
  channel: string;

  @ApiProperty({
    description: 'Order ID from the channel',
    example: 'SHOPEE-ORD-12345',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Item ID from the channel',
    example: 'SHOPEE-ITEM-12345',
  })
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @ApiPropertyOptional({
    description: 'Variant ID from the channel',
    example: 'SHOPEE-VAR-67890',
  })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({
    description: 'Order quantity',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Item price',
    example: 19.99,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '+84123456789',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;
}
