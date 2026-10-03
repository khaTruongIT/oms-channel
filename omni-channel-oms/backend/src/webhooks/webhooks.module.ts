import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ChannelMappingsModule } from '../channel-mappings/channel-mappings.module';
import { OrdersModule } from '../orders/orders.module';
import { ChannelAccountsModule } from '../channel-accounts/channel-accounts.module';

@Module({
  imports: [
    IntegrationsModule,
    ChannelMappingsModule,
    OrdersModule,
    ChannelAccountsModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
