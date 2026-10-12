import {
  IsEnum,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BulkJobType } from '../entities/bulk-job.entity';

export class CreateBulkJobDto {
  @ApiProperty({
    enum: BulkJobType,
    example: BulkJobType.PRODUCT_IMPORT,
    description: 'Type of bulk operation',
  })
  @IsEnum(BulkJobType)
  type: BulkJobType;

  @ApiProperty({
    example: [
      { sku: 'TSHIRT-RED-M', name: 'Cotton T-Shirt Red M', price: 15.5 },
    ],
    description: 'Array of records to process (max 5,000 rows)',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Must contain at least 1 record' })
  @ArrayMaxSize(5000, { message: 'Exceeds maximum allowed limit of 5,000 records' })
  rows: Record<string, any>[];

  @ApiPropertyOptional({
    example: false,
    description: 'If true, performs dry-run validation without executing changes',
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    example: 'idemp-bulk-job-12345',
    description: 'Idempotency key to prevent duplicate jobs',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
