import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({
    description: 'Master SKU ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  masterSkuId: string;

  @ApiProperty({
    description: 'Order quantity',
    example: 5,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Unit price',
    example: 19.99,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Sales channel name',
    example: 'shopee',
    enum: ['shopee', 'tiktok', 'lazada'],
  })
  @IsNotEmpty()
  @IsString()
  channel: string;

  @ApiProperty({
    description: 'External order ID from channel',
    example: 'SHOPEE-ORD-12345',
  })
  @IsNotEmpty()
  @IsString()
  externalOrderId: string;

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

  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Warehouse ID to fulfill from',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsString()
  warehouseId: string;
}
