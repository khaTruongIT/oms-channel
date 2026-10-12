import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Response,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import { BulkJobsService } from './bulk-jobs.service';
import { CreateBulkJobDto } from './dto/create-bulk-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bulk Jobs')
@ApiBearerAuth('JWT-auth')
@Controller('bulk-jobs')
@UseGuards(JwtAuthGuard)
export class BulkJobsController {
  constructor(private readonly bulkJobsService: BulkJobsService) {}

  @ApiOperation({ summary: 'Submit or dry-run a bulk operation' })
  @ApiResponse({ status: 201, description: 'Bulk job created or validated' })
  @Post()
  async createJob(@Request() req: any, @Body() dto: CreateBulkJobDto) {
    const schemaName = req.tenantSchema;
    const userId = req.user?.userId;
    return this.bulkJobsService.createJob(dto, schemaName, userId);
  }

  @ApiOperation({ summary: 'Get status and details of a bulk job' })
  @ApiParam({ name: 'id', description: 'Bulk job UUID' })
  @Get(':id')
  async getJob(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const schemaName = req.tenantSchema;
    return this.bulkJobsService.getJob(id, schemaName);
  }

  @ApiOperation({ summary: 'Download error report as CSV' })
  @ApiParam({ name: 'id', description: 'Bulk job UUID' })
  @Get(':id/errors.csv')
  async downloadErrorsCsv(
    @Request() req: any,
    @Response() res: ExpressResponse,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const schemaName = req.tenantSchema;
    const csvContent = await this.bulkJobsService.getJobErrorsCsv(id, schemaName);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bulk-job-${id}-errors.csv"`,
    );
    res.send(csvContent);
  }

  @ApiOperation({ summary: 'Download exported CSV file' })
  @ApiParam({ name: 'id', description: 'Bulk job UUID' })
  @Get(':id/export.csv')
  async downloadExportCsv(
    @Request() req: any,
    @Response() res: ExpressResponse,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const schemaName = req.tenantSchema;
    const csvContent = await this.bulkJobsService.getJobExportCsv(id, schemaName);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bulk-export-${id}.csv"`,
    );
    res.send(csvContent);
  }
}
