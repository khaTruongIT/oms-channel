import {
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferStockDto {
  @ApiProperty({ description: 'Origin warehouse ID' })
  @IsUUID('all')
  fromWarehouseId: string;

  @ApiProperty({ description: 'Destination warehouse ID' })
  @IsUUID('all')
  toWarehouseId: string;

  @ApiProperty({ description: 'Master SKU ID to transfer' })
  @IsUUID('all')
  masterSkuId: string;

  @ApiProperty({ description: 'Quantity of items to transfer', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Transfer notes or reason' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Idempotency key for preventing duplicate transfers' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
