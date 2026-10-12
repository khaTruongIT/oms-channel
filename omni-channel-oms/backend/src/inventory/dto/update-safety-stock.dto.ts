import { IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSafetyStockDto {
  @ApiProperty({ description: 'Warehouse ID' })
  @IsUUID('all')
  warehouseId: string;

  @ApiProperty({ description: 'Master SKU ID' })
  @IsUUID('all')
  masterSkuId: string;

  @ApiProperty({ description: 'Safety stock threshold', minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  safetyStock: number;
}
