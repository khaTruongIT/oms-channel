import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
  IsUrl,
  IsEnum,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessType } from '../../database/entities/tenant.entity';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Shop name (minimum 3 characters)',
    example: 'My Awesome Shop',
    minLength: 3,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Shop name must be at least 3 characters long' })
  shopName: string;

  // ==================== Contact Information ====================
  @ApiPropertyOptional({
    description: 'Primary business email',
    example: 'contact@myshop.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Primary phone number',
    example: '+84 123 456 789',
  })
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Business website URL',
    example: 'https://myshop.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid URL format' })
  website?: string;

  // ==================== Address Information ====================
  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 Main Street',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional({
    description: 'Apartment, suite, unit, etc.',
    example: 'Suite 100',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Ho Chi Minh City',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State or Province',
    example: 'Ho Chi Minh',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Postal/ZIP code',
    example: '70000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'Vietnam',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  // ==================== Business Information ====================
  @ApiPropertyOptional({
    description: 'Legal business name',
    example: 'My Awesome Shop LLC',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Type of business',
    enum: BusinessType,
    example: BusinessType.RETAIL,
  })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @ApiPropertyOptional({
    description: 'Tax/VAT ID',
    example: 'TAX123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Business registration number',
    example: 'BRN-2024-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  // ==================== Branding ====================
  @ApiPropertyOptional({
    description: 'Logo image URL',
    example: 'https://myshop.com/logo.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid logo URL format' })
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Primary brand color (hex)',
    example: '#FF5733',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'Secondary brand color (hex)',
    example: '#33C1FF',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  secondaryColor?: string;

  // ==================== Settings ====================
  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'Asia/Ho_Chi_Minh',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({
    description: 'ISO currency code',
    example: 'VND',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Locale code',
    example: 'vi-VN',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @ApiPropertyOptional({
    description: 'Date format preference',
    example: 'DD/MM/YYYY',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  dateFormat?: string;
}
