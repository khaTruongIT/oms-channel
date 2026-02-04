import { Module } from '@nestjs/common';
import { ShopeeService } from './shopee/shopee.service';
import { TiktokService } from './tiktok/tiktok.service';
import { LazadaService } from './lazada/lazada.service';

@Module({
  providers: [ShopeeService, TiktokService, LazadaService],
  exports: [ShopeeService, TiktokService, LazadaService],
})
export class IntegrationsModule {}
