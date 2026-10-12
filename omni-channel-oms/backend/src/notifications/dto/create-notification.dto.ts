import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationSeverity } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, example: NotificationType.LOW_STOCK })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiPropertyOptional({ enum: NotificationSeverity, default: NotificationSeverity.INFO })
  @IsEnum(NotificationSeverity)
  @IsOptional()
  severity?: NotificationSeverity;

  @ApiProperty({ example: 'Cảnh báo sắp hết hàng' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Sản phẩm Áo thun (SKU-001) tại Kho Hà Nội còn dưới 10 sản phẩm.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ example: '/inventory' })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({ example: 'LOW_STOCK:SKU-001:wh-1:2026-10-12' })
  @IsString()
  @IsOptional()
  dedupeKey?: string;

  @ApiPropertyOptional({ example: 'user-uuid-123' })
  @IsUUID()
  @IsOptional()
  userId?: string;
}
