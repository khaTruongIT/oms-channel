import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ChannelProvider {
  SHOPEE = 'shopee',
}

export enum ChannelAccountStatus {
  PENDING_CONTRACT = 'PENDING_CONTRACT',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

@Entity({ schema: 'public', name: 'channel_accounts' })
@Index(['tenantId', 'provider', 'shopId'], { unique: true })
export class ChannelAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar', length: 50 })
  provider: ChannelProvider;

  @Column({ type: 'varchar', length: 255, name: 'shop_id' })
  shopId: string;

  @Column({ type: 'varchar', length: 255, name: 'shop_name', nullable: true })
  shopName?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: ChannelAccountStatus.PENDING_CONTRACT,
  })
  status: ChannelAccountStatus;

  @Column({
    type: 'text',
    name: 'credentials_ciphertext',
    nullable: true,
    select: false,
  })
  credentialsCiphertext?: string;

  @Column({ type: 'timestamp', name: 'token_expires_at', nullable: true })
  tokenExpiresAt?: Date;

  @Column({ type: 'uuid', name: 'webhook_callback_id', unique: true })
  webhookCallbackId: string;

  @Column({ type: 'timestamp', name: 'last_connected_at', nullable: true })
  lastConnectedAt?: Date;

  @Column({ type: 'varchar', length: 500, name: 'last_error', nullable: true })
  lastError?: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
