import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ChannelMappingsModule } from '../channel-mappings/channel-mappings.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [IntegrationsModule, ChannelMappingsModule, OrdersModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
