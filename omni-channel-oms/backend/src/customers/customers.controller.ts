import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: 'Get list of customers with search and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated customer list' })
  @Get()
  async getCustomers(
    @Request() req: any,
    @Query() query: QueryCustomersDto,
  ) {
    const schemaName = req.tenantSchema;
    return this.customersService.findAll(query, schemaName);
  }

  @ApiOperation({ summary: 'Get customer details by id with recent orders' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @Get(':id')
  async getCustomer(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const schemaName = req.tenantSchema;
    return this.customersService.findOne(id, schemaName);
  }
}
