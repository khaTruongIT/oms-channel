import {
  Controller,
  Get,
  Post,
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
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Get notifications list and unread count' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  @Get()
  async getNotifications(
    @Request() req: any,
    @Query() query: QueryNotificationsDto,
  ) {
    const schemaName = req.tenantSchema;
    const userId = req.user?.userId;
    return this.notificationsService.findAll(query, schemaName, userId);
  }

  @ApiOperation({ summary: 'Mark single notification as read' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @Post(':id/read')
  async markAsRead(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const schemaName = req.tenantSchema;
    const userId = req.user?.userId;
    return this.notificationsService.markAsRead(id, schemaName, userId);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Post('read-all')
  async markAllAsRead(@Request() req: any) {
    const schemaName = req.tenantSchema;
    const userId = req.user?.userId;
    return this.notificationsService.markAllAsRead(schemaName, userId);
  }
}
