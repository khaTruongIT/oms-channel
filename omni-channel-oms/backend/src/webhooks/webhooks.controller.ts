import {
  Controller,
  Headers,
  Post,
  Req,
  Body,
  Request,
  UseGuards,
  NotFoundException,
  Param,
  ServiceUnavailableException,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhookOrderDto } from './dto/webhook-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
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
    @Request() req: AuthenticatedRequest,
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

  /**
   * This route intentionally does not accept JWTs. The official Shopee signing
   * contract is not available yet, therefore it fails closed until an adapter
   * verifier is registered. That prevents an unauthenticated marketplace route
   * from becoming an order-creation endpoint during the contract gate.
   */
  @Post('shopee/:callbackId')
  async handleShopeeCallback(
    @Param('callbackId') callbackId: string,
    @Req() request: ExpressRequest & { rawBody?: Buffer },
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    if (!request.rawBody) {
      throw new ServiceUnavailableException('Raw webhook body is unavailable');
    }

    return this.webhooksService.receiveShopeeWebhook(
      callbackId,
      request.rawBody,
      headers,
    );
  }
}
