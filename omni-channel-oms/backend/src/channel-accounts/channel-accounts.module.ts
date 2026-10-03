import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelAccount } from '../database/entities/channel-account.entity';
import { ChannelAccountsController } from './channel-accounts.controller';
import { ChannelAccountsService } from './channel-accounts.service';
import { CredentialCipherService } from './credential-cipher.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChannelAccount])],
  controllers: [ChannelAccountsController],
  providers: [ChannelAccountsService, CredentialCipherService],
  exports: [ChannelAccountsService],
})
export class ChannelAccountsModule {}
