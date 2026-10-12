import { Module, forwardRef } from '@nestjs/common';
import { IntegrationOperationsController } from './integration-operations.controller';
import { IntegrationOperationsService } from './integration-operations.service';
import { ChannelAccountsModule } from '../channel-accounts/channel-accounts.module';
import { ChannelMappingsModule } from '../channel-mappings/channel-mappings.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    ChannelAccountsModule,
    ChannelMappingsModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [IntegrationOperationsController],
  providers: [IntegrationOperationsService],
  exports: [IntegrationOperationsService],
})
export class IntegrationOperationsModule {}
