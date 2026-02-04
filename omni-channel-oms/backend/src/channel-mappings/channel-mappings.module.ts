import { Module } from '@nestjs/common';
import { ChannelMappingsService } from './channel-mappings.service';
import { ChannelMappingsController } from './channel-mappings.controller';

@Module({
  controllers: [ChannelMappingsController],
  providers: [ChannelMappingsService],
  exports: [ChannelMappingsService],
})
export class ChannelMappingsModule {}
