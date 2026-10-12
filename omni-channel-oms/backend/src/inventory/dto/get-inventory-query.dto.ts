import { IsOptional, IsUUID, IsBoolean, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class GetInventoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by warehouse ID' })
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by master SKU ID' })
  @IsOptional()
  @IsUUID('all')
  masterSkuId?: string;

  @ApiPropertyOptional({
    description: 'Filter only low stock items (ATS <= 0 or on-hand <= safety_stock)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return undefined;
  })
  @IsBoolean()
  lowStock?: boolean;

  @ApiPropertyOptional({ description: 'Search term for SKU code or product name' })
  @IsOptional()
  @IsString()
  q?: string;
}
