import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AdjustInventoryDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsString()
  @IsNotEmpty()
  masterSkuId!: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174001" })
  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  quantity!: number;

  @ApiPropertyOptional({ example: "Received new stock from CMS" })
  @IsOptional()
  @IsString()
  reason?: string;
}
