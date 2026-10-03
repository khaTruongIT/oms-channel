import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../database/entities/user-tenant-role.entity';
import { ChannelAccountsService } from './channel-accounts.service';
import { CreateChannelAccountDto } from './dto/create-channel-account.dto';

@Controller('channel-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChannelAccountsController {
  constructor(
    private readonly channelAccountsService: ChannelAccountsService,
  ) {}

  @Get()
  async list(@Request() request: { user: { tenantId?: string } }) {
    return this.channelAccountsService.listForTenant(this.getTenantId(request));
  }

  @Post('shopee')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async createShopee(
    @Request() request: { user: { tenantId?: string } },
    @Body() dto: CreateChannelAccountDto,
  ) {
    return this.channelAccountsService.createShopeeAccount(
      this.getTenantId(request),
      dto,
    );
  }

  @Post(':id/reconnect')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async reconnect(
    @Request() request: { user: { tenantId?: string } },
    @Param('id') id: string,
  ) {
    return this.channelAccountsService.requestReconnect(
      id,
      this.getTenantId(request),
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async disconnect(
    @Request() request: { user: { tenantId?: string } },
    @Param('id') id: string,
  ) {
    return this.channelAccountsService.disconnect(
      id,
      this.getTenantId(request),
    );
  }

  private getTenantId(request: { user: { tenantId?: string } }): string {
    if (!request.user.tenantId) {
      throw new NotFoundException('Tenant information not found');
    }
    return request.user.tenantId;
  }
}
