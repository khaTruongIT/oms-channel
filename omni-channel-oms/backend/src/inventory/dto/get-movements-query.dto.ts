import { IsOptional, IsUUID, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class GetMovementsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by master SKU ID' })
  @IsOptional()
  @IsUUID('all')
  masterSkuId?: string;

  @ApiPropertyOptional({ description: 'Filter by warehouse ID' })
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsOptional()
  @IsUUID('all')
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by movement type (e.g., RESERVE, RELEASE, DEDUCT, RESTOCK, ADJUST_ADD, ADJUST_SUBTRACT, TRANSFER_IN, TRANSFER_OUT)',
  })
  @IsOptional()
  @IsString()
  movementType?: string;

  @ApiPropertyOptional({ description: 'Filter movements from date (ISO string)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter movements to date (ISO string)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
