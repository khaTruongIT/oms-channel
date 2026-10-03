import { ApiPropertyOptional } from "@nestjs/swagger";
import { leadStatuses, type LeadStatus } from "@optiqis/shared";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ListLeadsDto {
  @ApiPropertyOptional({ enum: leadStatuses })
  @IsOptional()
  @IsIn(leadStatuses)
  status?: LeadStatus;

  @ApiPropertyOptional({ example: "0901234567" })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  query?: string;
}
