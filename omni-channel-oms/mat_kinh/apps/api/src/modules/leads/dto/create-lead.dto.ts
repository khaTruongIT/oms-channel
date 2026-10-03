import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { leadSources, type LeadSource } from "@optiqis/shared";
import { IsEmail, IsIn, IsOptional, IsString, Length, Matches, MaxLength } from "class-validator";

const phonePattern = /^(\+?84|0)(\d[\s.-]?){8,10}\d$/;

export class CreateLeadDto {
  @ApiProperty({ example: "Nguyen Minh Anh" })
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @ApiProperty({ example: "0901234567" })
  @IsString()
  @Matches(phonePattern, { message: "phone must be a valid Vietnam phone number" })
  phone!: string;

  @ApiPropertyOptional({ example: "minhanh@example.com" })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: "TP. Hồ Chí Minh" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  province?: string;

  @ApiPropertyOptional({ example: "Quận 1" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @ApiPropertyOptional({ example: "product-digital-shield" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  productId?: string;

  @ApiPropertyOptional({ example: "OPTIQIS Digital Shield Pro" })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  productName?: string;

  @ApiPropertyOptional({ example: "clinic-hcm-q1" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  clinicId?: string;

  @ApiPropertyOptional({ example: "Cuối tuần" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  preferredTime?: string;

  @ApiPropertyOptional({ example: "Tôi cần tư vấn tròng kính chống ánh sáng xanh." })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  note?: string;

  @ApiProperty({ enum: leadSources, example: "PRODUCT_DETAIL" })
  @IsIn(leadSources)
  source!: LeadSource;
}
