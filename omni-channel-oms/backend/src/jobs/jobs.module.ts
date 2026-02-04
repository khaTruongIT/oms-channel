import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { StockSyncProcessor } from './processors/stock-sync.processor';
import { BatchSyncProcessor } from './processors/batch-sync.processor';
import { StockSyncScheduler } from './stock-sync.scheduler';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ChannelMappingsModule } from '../channel-mappings/channel-mappings.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'stock-sync',
      },
      {
        name: 'batch-sync',
      },
    ),
    IntegrationsModule,
    ChannelMappingsModule,
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    StockSyncProcessor,
    BatchSyncProcessor,
    StockSyncScheduler,
  ],
  exports: [JobsService],
})
export class JobsModule {}
