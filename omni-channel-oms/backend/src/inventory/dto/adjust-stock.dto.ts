import {
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({
    description: 'Master SKU ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  masterSkuId: string;

  @ApiProperty({
    description: 'Warehouse ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsUUID()
  warehouseId: string;

  @ApiProperty({
    description: 'Quantity to adjust (can be negative)',
    example: 50,
  })
  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @ApiPropertyOptional({
    description: 'Reason for stock adjustment',
    example: 'Received new shipment',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
