import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateClinicDto {
  @ApiProperty({ example: "Trung tâm Khúc xạ OPTIQIS Quận 1" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "TP. Hồ Chí Minh" })
  @IsString()
  @IsNotEmpty()
  province!: string;

  @ApiProperty({ example: "Quận 1" })
  @IsString()
  @IsNotEmpty()
  district!: string;

  @ApiProperty({ example: "24 Nguyễn Huệ, Phường Bến Nghé" })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: "1800 6919" })
  @IsString()
  @IsNotEmpty()
  hotline!: string;

  @ApiProperty({ example: "08:00 - 20:30" })
  @IsString()
  @IsNotEmpty()
  hours!: string;

  @ApiProperty({ example: 10.7758 })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: 106.7009 })
  @IsNumber()
  lng!: number;

  @ApiProperty({ example: ["Đo mắt 12 bước", "Tư vấn Digital Shield"] })
  @IsArray()
  @IsString({ each: true })
  services!: string[];
}

export class UpdateClinicDto extends PartialType(CreateClinicDto) {}
