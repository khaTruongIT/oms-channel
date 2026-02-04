import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({
    description: 'Warehouse name',
    example: 'Main Warehouse',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Warehouse location',
    example: 'Ho Chi Minh City, Vietnam',
  })
  @IsNotEmpty()
  @IsString()
  location: string;
}
