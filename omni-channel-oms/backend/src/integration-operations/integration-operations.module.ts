import { Module } from '@nestjs/common';
import { IntegrationOperationsController } from './integration-operations.controller';
import { IntegrationOperationsService } from './integration-operations.service';
import { ChannelAccountsModule } from '../channel-accounts/channel-accounts.module';

@Module({
  imports: [ChannelAccountsModule],
  controllers: [IntegrationOperationsController],
  providers: [IntegrationOperationsService],
  exports: [IntegrationOperationsService],
})
export class IntegrationOperationsModule {}
