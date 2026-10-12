import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWarehouseDto {
  @ApiPropertyOptional({
    description: 'Warehouse name',
    example: 'Main Warehouse Updated',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Warehouse location',
    example: 'Da Nang, Vietnam',
  })
  @IsOptional()
  @IsString()
  location?: string;
}
