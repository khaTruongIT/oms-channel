import { IsDateString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SalesReportQueryDto {
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
    description: 'Group by period or channel',
    enum: ['day', 'channel'],
    default: 'day',
  })
  @IsOptional()
  @IsIn(['day', 'channel'], {
    message: 'groupBy must be either "day" or "channel"',
  })
  groupBy?: 'day' | 'channel' = 'day';
}
