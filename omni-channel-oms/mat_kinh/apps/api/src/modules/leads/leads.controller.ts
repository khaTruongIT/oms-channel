import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { ConsultationLead } from "@optiqis/shared";
import { ApiErrorResponseDto, ConsultationLeadResponseDto, LeadSubmissionResponseDto } from "../../common/api-docs.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { strictDtoPipe } from "../../common/pipes";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { ListLeadsDto } from "./dto/list-leads.dto";
import { UpdateLeadStatusDto } from "./dto/update-lead-status.dto";
import { LeadsService, type LeadSubmissionResponse } from "./leads.service";

@ApiTags("leads")
@Controller()
export class LeadsController {
  constructor(@Inject(LeadsService) private readonly leadsService: LeadsService) {}

  @Post("leads")
  @ApiOperation({ summary: "Capture a public O2O consultation lead" })
  @ApiCreatedResponse({ type: LeadSubmissionResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  create(@Body(strictDtoPipe(CreateLeadDto)) dto: CreateLeadDto): Promise<LeadSubmissionResponse> {
    return this.leadsService.create(dto);
  }

  @Get("admin/leads")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] List consultation leads" })
  @ApiQuery({ name: "status", required: false, enum: ["NEW", "CONTACTED", "BOOKED", "CLOSED", "SPAM"] })
  @ApiQuery({ name: "query", required: false, example: "0901234567" })
  @ApiOkResponse({ type: [ConsultationLeadResponseDto] })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  findAll(@Query(strictDtoPipe(ListLeadsDto)) query: ListLeadsDto): Promise<ConsultationLead[]> {
    return this.leadsService.findAll(query);
  }

  @Patch("admin/leads/:id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[CMS] Update consultation lead status" })
  @ApiParam({ name: "id", example: "lead-123" })
  @ApiOkResponse({ type: ConsultationLeadResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  updateStatus(
    @Param("id") id: string,
    @Body(strictDtoPipe(UpdateLeadStatusDto)) dto: UpdateLeadStatusDto,
  ): Promise<ConsultationLead> {
    return this.leadsService.updateStatus(id, dto.status);
  }
}
