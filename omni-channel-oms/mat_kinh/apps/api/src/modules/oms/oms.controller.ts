import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { ApiErrorResponseDto } from "../../common/api-docs.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { OmsClient } from "./oms.client";
import type { OmsStatus } from "./oms.types";

@ApiTags("oms")
@Controller("admin/oms")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("demo-bearer")
export class OmsController {
  constructor(@Inject(OmsClient) private readonly omsClient: OmsClient) {}

  @Get("status")
  @Roles("ADMIN", "EDITOR")
  @ApiOperation({ summary: "[CMS] Check OMS integration health/status" })
  @ApiOkResponse({ description: "OMS integration status" })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  getStatus(): Promise<OmsStatus> {
    return this.omsClient.getStatus();
  }
}
