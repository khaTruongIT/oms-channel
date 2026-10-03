import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  ChannelAccount,
  ChannelAccountStatus,
  ChannelProvider,
} from '../database/entities/channel-account.entity';
import { CreateChannelAccountDto } from './dto/create-channel-account.dto';
import { CredentialCipherService } from './credential-cipher.service';

export interface ChannelAccountResponse {
  id: string;
  provider: ChannelProvider;
  shopId: string;
  shopName?: string;
  status: ChannelAccountStatus;
  tokenExpiresAt?: Date;
  webhookCallbackId: string;
  lastConnectedAt?: Date;
  lastError?: string;
  createdAt: Date;
}

@Injectable()
export class ChannelAccountsService {
  constructor(
    @InjectRepository(ChannelAccount)
    private readonly channelAccountRepository: Repository<ChannelAccount>,
    private readonly credentialCipherService: CredentialCipherService,
  ) {}

  async createShopeeAccount(
    tenantId: string,
    dto: CreateChannelAccountDto,
  ): Promise<ChannelAccountResponse> {
    const existing = await this.channelAccountRepository.findOne({
      where: { tenantId, provider: ChannelProvider.SHOPEE, shopId: dto.shopId },
    });
    if (existing) {
      throw new ConflictException(
        'A Shopee account already exists for this shop',
      );
    }

    const account = this.channelAccountRepository.create({
      tenantId,
      provider: ChannelProvider.SHOPEE,
      shopId: dto.shopId,
      shopName: dto.shopName,
      status: ChannelAccountStatus.PENDING_CONTRACT,
      webhookCallbackId: randomUUID(),
      credentialsCiphertext: dto.credentials
        ? this.credentialCipherService.encrypt(dto.credentials)
        : undefined,
    });
    const saved = await this.channelAccountRepository.save(account);
    return this.toResponse(saved);
  }

  async listForTenant(tenantId: string): Promise<ChannelAccountResponse[]> {
    const accounts = await this.channelAccountRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return accounts.map((account) => this.toResponse(account));
  }

  async requestReconnect(
    id: string,
    tenantId: string,
  ): Promise<ChannelAccountResponse> {
    const account = await this.findForTenant(id, tenantId);
    account.status = ChannelAccountStatus.PENDING_CONTRACT;
    account.lastError =
      'Shopee Partner contract is required before a connection can be established';
    const saved = await this.channelAccountRepository.save(account);
    return this.toResponse(saved);
  }

  async disconnect(
    id: string,
    tenantId: string,
  ): Promise<ChannelAccountResponse> {
    const account = await this.findForTenant(id, tenantId);
    account.status = ChannelAccountStatus.DISCONNECTED;
    account.lastError = undefined;
    const saved = await this.channelAccountRepository.save(account);
    return this.toResponse(saved);
  }

  async findForWebhook(callbackId: string): Promise<ChannelAccount> {
    const account = await this.channelAccountRepository.findOne({
      where: { webhookCallbackId: callbackId },
    });
    if (!account) {
      throw new NotFoundException('Channel account not found');
    }
    return account;
  }

  async getForTenant(id: string, tenantId: string): Promise<ChannelAccount> {
    return this.findForTenant(id, tenantId);
  }

  private async findForTenant(
    id: string,
    tenantId: string,
  ): Promise<ChannelAccount> {
    const account = await this.channelAccountRepository.findOne({
      where: { id, tenantId },
    });
    if (!account) {
      throw new NotFoundException('Channel account not found');
    }
    return account;
  }

  private toResponse(account: ChannelAccount): ChannelAccountResponse {
    return {
      id: account.id,
      provider: account.provider,
      shopId: account.shopId,
      shopName: account.shopName,
      status: account.status,
      tokenExpiresAt: account.tokenExpiresAt,
      webhookCallbackId: account.webhookCallbackId,
      lastConnectedAt: account.lastConnectedAt,
      lastError: account.lastError,
      createdAt: account.createdAt,
    };
  }
}
