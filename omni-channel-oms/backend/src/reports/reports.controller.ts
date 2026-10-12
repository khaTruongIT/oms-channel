import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ReportsService,
  SalesReportRow,
  InventoryValueResponse,
  TopSkuRow,
} from './reports.service';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { TopSkusQueryDto } from './dto/top-skus-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({
    summary: 'Sales analytics report grouped by day or channel',
  })
  @ApiResponse({ status: 200, description: 'Sales report aggregated rows' })
  @ApiResponse({ status: 400, description: 'Invalid date range or format' })
  @Get('sales')
  async getSalesReport(
    @Request() req: any,
    @Query() query: SalesReportQueryDto,
  ): Promise<SalesReportRow[]> {
    const schemaName = req.tenantSchema || req.user?.schemaName;
    return this.reportsService.getSalesReport(query, schemaName);
  }

  @ApiOperation({
    summary: 'Inventory valuation and stock health report',
  })
  @ApiResponse({ status: 200, description: 'Inventory valuation by category' })
  @Get('inventory-value')
  async getInventoryValueReport(
    @Request() req: any,
  ): Promise<InventoryValueResponse> {
    const schemaName = req.tenantSchema || req.user?.schemaName;
    return this.reportsService.getInventoryValueReport(schemaName);
  }

  @ApiOperation({
    summary: 'Top performing SKUs by revenue and volume',
  })
  @ApiResponse({ status: 200, description: 'Top SKUs report' })
  @ApiResponse({ status: 400, description: 'Invalid date range or format' })
  @Get('top-skus')
  async getTopSkusReport(
    @Request() req: any,
    @Query() query: TopSkusQueryDto,
  ): Promise<TopSkuRow[]> {
    const schemaName = req.tenantSchema || req.user?.schemaName;
    return this.reportsService.getTopSkusReport(query, schemaName);
  }
}
