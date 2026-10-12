import { Module } from '@nestjs/common';
import { BulkJobsService } from './bulk-jobs.service';
import { BulkJobsController } from './bulk-jobs.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TenantsModule, NotificationsModule],
  controllers: [BulkJobsController],
  providers: [BulkJobsService],
  exports: [BulkJobsService],
})
export class BulkJobsModule {}
