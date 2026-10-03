import { IsNotEmpty, IsUUID, IsInt, Min, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReserveStockDto {
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
    description: 'Quantity to reserve',
    example: 10,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description:
      'Client-generated key used to safely retry the same reservation',
  })
  @IsNotEmpty()
  @IsString()
  idempotencyKey: string;
}
