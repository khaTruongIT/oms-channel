import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ChannelMappingsService } from './channel-mappings.service';
import { CreateChannelMappingDto } from './dto/create-channel-mapping.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user-tenant-role.entity';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Channel Mappings')
@ApiBearerAuth('JWT-auth')
@Controller('channel-mappings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChannelMappingsController {
  constructor(
    private readonly channelMappingsService: ChannelMappingsService,
  ) {}

  @ApiOperation({ summary: 'Create channel mapping' })
  @ApiResponse({ status: 201, description: 'Mapping successfully created' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Post()
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async createMapping(
    @Request() req: AuthenticatedRequest,
    @Body() createChannelMappingDto: CreateChannelMappingDto,
  ) {
    const schemaName = req.user.schemaName;
    const tenantId = req.user.tenantId;

    if (!schemaName || !tenantId) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.channelMappingsService.createMapping(
      createChannelMappingDto,
      schemaName,
      tenantId,
    );
  }

  @ApiOperation({ summary: 'Get all channel mappings' })
  @ApiQuery({
    name: 'channel',
    required: false,
    description: 'Filter by channel',
  })
  @ApiResponse({ status: 200, description: 'Returns list of channel mappings' })
  @Get()
  async getAllMappings(
    @Request() req: AuthenticatedRequest,
    @Query('channel') channel?: string,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    if (channel) {
      return this.channelMappingsService.getMappingsByChannel(
        channel,
        schemaName,
      );
    }

    return this.channelMappingsService.getAllMappings(schemaName);
  }

  @ApiOperation({ summary: 'Get mappings by product' })
  @ApiParam({ name: 'masterSkuId', description: 'Master SKU ID' })
  @ApiResponse({ status: 200, description: 'Returns mappings for the product' })
  @Get('product/:masterSkuId')
  async getMappingsByProduct(
    @Request() req: AuthenticatedRequest,
    @Param('masterSkuId') masterSkuId: string,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.channelMappingsService.getMappingsByMasterSku(
      masterSkuId,
      schemaName,
    );
  }

  @ApiOperation({ summary: 'Delete channel mapping' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiResponse({ status: 200, description: 'Mapping deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async deleteMapping(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    await this.channelMappingsService.deleteMapping(id, schemaName);
    return { message: 'Channel mapping deleted successfully' };
  }
}
