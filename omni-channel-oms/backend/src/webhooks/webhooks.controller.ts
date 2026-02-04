import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhookOrderDto } from './dto/webhook-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @ApiOperation({ summary: 'Handle order webhook from sales channels' })
  @ApiResponse({
    status: 201,
    description: 'Order webhook processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  @ApiBearerAuth('JWT-auth')
  @Post('order')
  @UseGuards(JwtAuthGuard)
  async handleOrderWebhook(
    @Request() req,
    @Body() webhookOrderDto: WebhookOrderDto,
  ) {
    const schemaName = req.user.schemaName;
    const userId = req.user.userId;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.webhooksService.handleOrderWebhook(
      webhookOrderDto,
      schemaName,
      userId,
    );
  }
}
