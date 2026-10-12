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
import { SearchService, SearchResponse } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Search')
@ApiBearerAuth('JWT-auth')
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({
    summary: 'Global search across products, orders, and customers',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query (minimum 2 characters)',
  })
  @ApiQuery({
    name: 'types',
    required: false,
    description: 'Filter by entity types (comma-separated: products,orders,customers)',
  })
  @ApiResponse({ status: 200, description: 'Unified search results' })
  @ApiResponse({ status: 400, description: 'Validation failed or q too short' })
  @Get()
  async globalSearch(
    @Request() req: any,
    @Query() queryDto: SearchQueryDto,
  ): Promise<SearchResponse> {
    const schemaName = req.tenantSchema || req.user?.schemaName;
    return this.searchService.search(queryDto, schemaName);
  }
}
