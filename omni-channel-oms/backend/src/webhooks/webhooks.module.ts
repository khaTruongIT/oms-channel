import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ChannelMappingsModule } from '../channel-mappings/channel-mappings.module';
import { OrdersModule } from '../orders/orders.module';
import { ChannelAccountsModule } from '../channel-accounts/channel-accounts.module';
import { IntegrationOperationsModule } from '../integration-operations/integration-operations.module';

import { InboxProcessor } from './inbox.processor';

@Module({
  imports: [
    IntegrationsModule,
    ChannelMappingsModule,
    OrdersModule,
    ChannelAccountsModule,
    IntegrationOperationsModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, InboxProcessor],
  exports: [WebhooksService, InboxProcessor],
})
export class WebhooksModule {}
