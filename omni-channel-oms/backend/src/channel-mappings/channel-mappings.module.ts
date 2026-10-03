import { Module } from '@nestjs/common';
import { ChannelMappingsService } from './channel-mappings.service';
import { ChannelMappingsController } from './channel-mappings.controller';
import { ChannelAccountsModule } from '../channel-accounts/channel-accounts.module';

@Module({
  imports: [ChannelAccountsModule],
  controllers: [ChannelMappingsController],
  providers: [ChannelMappingsService],
  exports: [ChannelMappingsService],
})
export class ChannelMappingsModule {}
