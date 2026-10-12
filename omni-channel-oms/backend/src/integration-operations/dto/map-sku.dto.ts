import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MapSkuDto {
  @ApiProperty({ description: 'Master SKU UUID to map external product to' })
  @IsNotEmpty()
  @IsUUID()
  masterSkuId: string;
}
