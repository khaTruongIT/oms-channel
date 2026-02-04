import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
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
import { TenantMembersService } from './tenant-members.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tenant Members')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard)
export class TenantMembersController {
  constructor(private readonly tenantMembersService: TenantMembersService) {}

  @ApiOperation({ summary: 'Get tenant members' })
  @Get('tenants/:id/members')
  async getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantMembersService.getMembers(id);
  }

  @ApiOperation({ summary: 'Get pending invites' })
  @Get('tenants/:id/invites')
  async getInvites(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantMembersService.getPendingInvites(id);
  }

  @ApiOperation({ summary: 'Invite a new member' })
  @Post('tenants/:id/invites')
  async inviteMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body() dto: InviteMemberDto,
  ) {
    return this.tenantMembersService.inviteMember(
      id,
      req.user.userId,
      dto.email,
      dto.role,
    );
  }

  @ApiOperation({ summary: 'Cancel an invite' })
  @Delete('tenants/:id/invites/:inviteId')
  async cancelInvite(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
    @Request() req,
  ) {
    return this.tenantMembersService.cancelInvite(
      id,
      req.user.userId,
      inviteId,
    );
  }

  @ApiOperation({ summary: 'Remove a member' })
  @Delete('tenants/:id/members/:userId')
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req,
  ) {
    return this.tenantMembersService.removeMember(id, req.user.userId, userId);
  }

  @ApiOperation({ summary: 'Update member role' })
  @Patch('tenants/:id/members/:userId/role')
  async updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.tenantMembersService.updateMemberRole(
      id,
      req.user.userId,
      userId,
      dto.role,
    );
  }

  @ApiOperation({ summary: 'Accept an invite' })
  @Post('invites/accept')
  async acceptInvite(@Body('token') token: string, @Request() req) {
    return this.tenantMembersService.acceptInvite(token, req.user.userId);
  }
}
