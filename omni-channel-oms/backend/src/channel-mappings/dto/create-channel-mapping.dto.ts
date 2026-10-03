import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChannelMappingDto {
  @ApiProperty({
    description: 'Master SKU ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  masterSkuId: string;

  @ApiPropertyOptional({
    description: 'Connected channel account for this external SKU mapping',
  })
  @IsOptional()
  @IsString()
  channelAccountId?: string;

  @ApiProperty({
    description: 'Sales channel',
    example: 'shopee',
    enum: ['shopee', 'tiktok', 'lazada'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['shopee', 'tiktok', 'lazada'])
  channel: string;

  @ApiProperty({
    description: 'External item ID from the channel',
    example: 'SHOPEE-ITEM-12345',
  })
  @IsNotEmpty()
  @IsString()
  externalItemId: string;

  @ApiPropertyOptional({
    description: 'External variant ID from the channel',
    example: 'SHOPEE-VAR-67890',
  })
  @IsOptional()
  @IsString()
  externalVariantId?: string;
}
