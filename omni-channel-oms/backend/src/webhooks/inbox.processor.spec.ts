import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { InboxProcessor } from './inbox.processor';
import { WebhooksService } from './webhooks.service';

describe('InboxProcessor', () => {
  let processor: InboxProcessor;
  let webhooksService: Partial<WebhooksService>;
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    query: jest.Mock;
  };
  let dataSource: {
    createQueryRunner: jest.Mock;
  };

  beforeEach(async () => {
    webhooksService = {
      handleOrderWebhook: jest.fn(),
    };

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: jest.fn(),
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InboxProcessor,
        { provide: DataSource, useValue: dataSource },
        { provide: WebhooksService, useValue: webhooksService },
      ],
    }).compile();

    processor = module.get<InboxProcessor>(InboxProcessor);
  });

  it('S3.1.1: queries messages with FOR UPDATE SKIP LOCKED to prevent concurrent processing', async () => {
    queryRunner.query
      .mockResolvedValueOnce([
        {
          id: 'msg-1',
          channel_account_id: 'acc-1',
          provider: 'shopee',
          delivery_id: 'del-1',
          payload: { orderId: 'ORD-1', channel: 'shopee', itemId: 'ITEM-1', quantity: 1, price: 10 },
          attempt_count: 0,
          status: 'RECEIVED',
        },
      ]) // SELECT FOR UPDATE SKIP LOCKED
      .mockResolvedValueOnce([]); // UPDATE status = 'PROCESSED'

    (webhooksService.handleOrderWebhook as jest.Mock).mockResolvedValue({
      status: 'success',
      orderNumber: 'ORD-1',
    });

    const result = await processor.processBatch('tenant_1', { batchSize: 5 });

    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE SKIP LOCKED'),
      expect.any(Array),
    );
    expect(result.processedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.deadCount).toBe(0);
  });

  it('S3.1.1: marks poison message as DEAD when maxAttempts reached', async () => {
    queryRunner.query
      .mockResolvedValueOnce([
        {
          id: 'poison-msg',
          channel_account_id: 'acc-1',
          provider: 'shopee',
          delivery_id: 'del-poison',
          payload: { orderId: 'ORD-ERR' },
          attempt_count: 2, // will reach maxAttempts 3
          status: 'FAILED',
        },
      ])
      .mockResolvedValueOnce([]); // UPDATE status = 'DEAD'

    (webhooksService.handleOrderWebhook as jest.Mock).mockRejectedValue(
      new Error('Fatal unrecoverable processing error'),
    );

    const result = await processor.processBatch('tenant_1', { maxAttempts: 3 });

    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'DEAD'"),
      expect.arrayContaining(['poison-msg']),
    );
    expect(result.deadCount).toBe(1);
    expect(result.processedCount).toBe(0);
  });

  it('S3.1.1: does not throw out of the loop when a message fails, continuing remaining messages', async () => {
    queryRunner.query
      .mockResolvedValueOnce([
        {
          id: 'fail-msg-1',
          channel_account_id: 'acc-1',
          provider: 'shopee',
          delivery_id: 'del-fail',
          payload: { orderId: 'ORD-FAIL', channel: 'shopee', itemId: 'ITEM-FAIL', quantity: 1, price: 10 },
          attempt_count: 0,
          status: 'RECEIVED',
        },
        {
          id: 'success-msg-2',
          channel_account_id: 'acc-1',
          provider: 'shopee',
          delivery_id: 'del-success',
          payload: { orderId: 'ORD-OK', channel: 'shopee', itemId: 'ITEM-OK', quantity: 1, price: 10 },
          attempt_count: 0,
          status: 'RECEIVED',
        },
      ])
      .mockResolvedValueOnce([]) // UPDATE msg 1 FAILED
      .mockResolvedValueOnce([]); // UPDATE msg 2 PROCESSED

    (webhooksService.handleOrderWebhook as jest.Mock)
      .mockRejectedValueOnce(new Error('Transient network error'))
      .mockResolvedValueOnce({ status: 'success', orderNumber: 'ORD-OK' });

    // Must resolve cleanly without throwing
    const result = await processor.processBatch('tenant_1');

    expect(result.failedCount).toBe(1);
    expect(result.processedCount).toBe(1);
  });
});
