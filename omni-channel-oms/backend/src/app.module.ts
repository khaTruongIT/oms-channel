import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { ChannelMappingsModule } from './channel-mappings/channel-mappings.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { JobsModule } from './jobs/jobs.module';
import { AuditModule } from './common/audit/audit.module';
import { HealthModule } from './health/health.module';
import { ChannelAccountsModule } from './channel-accounts/channel-accounts.module';
import { IntegrationOperationsModule } from './integration-operations/integration-operations.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    AuthModule,
    TenantsModule,
    ProductsModule,
    CategoriesModule,
    WarehousesModule,
    InventoryModule,
    OrdersModule,
    ChannelMappingsModule,
    IntegrationsModule,
    WebhooksModule,
    JobsModule,
    AuditModule,
    HealthModule,
    ChannelAccountsModule,
    IntegrationOperationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestContextMiddleware,
        SecurityHeadersMiddleware,
        LoggerMiddleware,
      )
      .forRoutes('*');
  }
}
