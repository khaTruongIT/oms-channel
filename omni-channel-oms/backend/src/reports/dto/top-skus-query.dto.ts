import { IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopSkusQueryDto {
  @ApiProperty({
    description: 'Start date (ISO 8601)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsDateString()
  from: string;

  @ApiProperty({
    description: 'End date (ISO 8601)',
    example: '2026-01-31T23:59:59.999Z',
  })
  @IsDateString()
  to: string;

  @ApiPropertyOptional({
    description: 'Limit top SKUs (default 10, max 50)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
