import { ApiProperty } from "@nestjs/swagger";
import { leadStatuses, type LeadStatus } from "@optiqis/shared";
import { IsIn } from "class-validator";

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: leadStatuses, example: "CONTACTED" })
  @IsIn(leadStatuses)
  status!: LeadStatus;
}
