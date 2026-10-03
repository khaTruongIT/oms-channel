import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
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
import type { Clinic } from "@optiqis/shared";
import { ApiErrorResponseDto, ClinicResponseDto, DeleteResponseDto } from "../../common/api-docs.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { strictDtoPipe } from "../../common/pipes";
import { ClinicsService } from "./clinics.service";
import { ListClinicsDto } from "./dto/list-clinics.dto";
import { CreateClinicDto, UpdateClinicDto } from "./dto/upsert-clinic.dto";

@ApiTags("clinics")
@Controller()
export class ClinicsController {
  constructor(@Inject(ClinicsService) private readonly clinicsService: ClinicsService) {}

  @Get("clinics")
  @ApiOperation({ summary: "Find OPTIQIS partner clinics by province, district, or search query" })
  @ApiQuery({ name: "province", required: false, example: "TP. Ho Chi Minh" })
  @ApiQuery({ name: "district", required: false, example: "Quan 1" })
  @ApiQuery({ name: "query", required: false, example: "Digital Shield" })
  @ApiOkResponse({ type: [ClinicResponseDto] })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  findAll(@Query(strictDtoPipe(ListClinicsDto)) query: ListClinicsDto): Promise<Clinic[]> {
    return this.clinicsService.findAll(query);
  }

  @Get("admin/clinics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Get all clinics with optional filters" })
  @ApiQuery({ name: "province", required: false, example: "TP. Ho Chi Minh" })
  @ApiQuery({ name: "district", required: false, example: "Quan 1" })
  @ApiQuery({ name: "query", required: false, example: "Digital Shield" })
  @ApiOkResponse({ type: [ClinicResponseDto] })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  adminFindAll(@Query(strictDtoPipe(ListClinicsDto)) query: ListClinicsDto): Promise<Clinic[]> {
    return this.clinicsService.findAll(query);
  }

  @Get("admin/clinics/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Get a clinic by ID" })
  @ApiParam({ name: "id", example: "clinic-hcm-q1" })
  @ApiOkResponse({ type: ClinicResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  adminFindOne(@Param("id") id: string): Promise<Clinic> {
    return this.clinicsService.findById(id);
  }

  @Post("admin/clinics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Create a partner clinic" })
  @ApiCreatedResponse({ type: ClinicResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  create(@Body(strictDtoPipe(CreateClinicDto)) dto: CreateClinicDto): Promise<Clinic> {
    return this.clinicsService.create(dto);
  }

  @Patch("admin/clinics/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "[CMS] Update clinic details" })
  @ApiParam({ name: "id", example: "clinic-hcm-q1" })
  @ApiOkResponse({ type: ClinicResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  update(@Param("id") id: string, @Body(strictDtoPipe(UpdateClinicDto)) dto: UpdateClinicDto): Promise<Clinic> {
    return this.clinicsService.update(id, dto);
  }

  @Delete("admin/clinics/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("demo-bearer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[CMS] Delete a clinic" })
  @ApiParam({ name: "id", example: "clinic-hcm-q1" })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  delete(@Param("id") id: string): Promise<{ success: boolean }> {
    return this.clinicsService.delete(id);
  }
}
