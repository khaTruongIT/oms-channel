import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import type { ProductSpecs } from "@optiqis/shared";
import { IsArray, IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
  @ApiProperty({ example: "digital-shield-pro" })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: "OPTIQIS Digital Shield Pro" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "Digital Shield" })
  @IsString()
  @IsNotEmpty()
  line!: string;

  @ApiProperty({ example: "Tròng kính lọc ánh sáng xanh chọn lọc cho người làm việc màn hình." })
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @ApiProperty({ example: ["screen", "office"] })
  @IsArray()
  @IsString({ each: true })
  needs!: string[];

  @ApiProperty({ example: ["1.60", "1.67", "1.74"] })
  @IsArray()
  @IsString({ each: true })
  indexes!: string[];

  @ApiProperty({ example: ["Diamond Nano-S", "Hydrophobic"] })
  @IsArray()
  @IsString({ each: true })
  coatings!: string[];

  @ApiProperty({ example: ["Nano-AR", "Selective Wave Filtering"] })
  @IsArray()
  @IsString({ each: true })
  technologies!: string[];

  @ApiProperty({ example: "https://images.unsplash.com/photo-1511499767150-a48a237f0083" })
  @IsString()
  @IsNotEmpty()
  heroImage!: string;

  @ApiProperty({
    example: {
      abbe: "32-42",
      uvProtection: "UV400+",
      recommendedFor: ["Kỹ sư phần mềm", "Dân văn phòng"],
      wavelength: {
        adverse: "415-455nm",
        beneficial: "465-495nm",
        claim: "Giảm đỉnh HEV có hại",
      },
    },
  })
  @IsObject()
  specsJson!: ProductSpecs;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
