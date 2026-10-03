import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductWavelengthDto {
  @ApiProperty({ example: '415-455nm' })
  @IsString()
  @IsNotEmpty()
  adverse: string;

  @ApiProperty({ example: '465-495nm' })
  @IsString()
  @IsNotEmpty()
  beneficial: string;

  @ApiProperty({ example: 'Giảm đỉnh HEV có hại' })
  @IsString()
  @IsNotEmpty()
  claim: string;
}

export class ProductSpecsDto {
  @ApiProperty({ example: '32-42' })
  @IsString()
  @IsNotEmpty()
  abbe: string;

  @ApiProperty({ example: 'UV400+' })
  @IsString()
  @IsNotEmpty()
  uvProtection: string;

  @ApiProperty({ example: ['Kỹ sư phần mềm', 'Dân văn phòng'] })
  @IsArray()
  @IsString({ each: true })
  recommendedFor: string[];

  @ApiProperty({ type: ProductWavelengthDto })
  @ValidateNested()
  @Type(() => ProductWavelengthDto)
  wavelength: ProductWavelengthDto;
}

export class ProductPublicMetadataDto {
  @ApiProperty({ example: 'digital-shield-pro' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    example: 'Tròng kính lọc ánh sáng xanh chọn lọc cho người làm việc màn hình.',
  })
  @IsString()
  @IsNotEmpty()
  summary: string;

  @ApiProperty({ example: ['screen', 'office'] })
  @IsArray()
  @IsString({ each: true })
  needs: string[];

  @ApiProperty({ example: ['1.60', '1.67', '1.74'] })
  @IsArray()
  @IsString({ each: true })
  indexes: string[];

  @ApiProperty({ example: ['Diamond Nano-S', 'Hydrophobic'] })
  @IsArray()
  @IsString({ each: true })
  coatings: string[];

  @ApiProperty({ example: ['Nano-AR', 'Selective Wave Filtering'] })
  @IsArray()
  @IsString({ each: true })
  technologies: string[];

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083',
  })
  @IsString()
  @IsNotEmpty()
  heroImage: string;

  @ApiProperty({ type: ProductSpecsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ProductSpecsDto)
  specsJson: ProductSpecsDto;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export type ProductPublicMetadata = ProductPublicMetadataDto;
