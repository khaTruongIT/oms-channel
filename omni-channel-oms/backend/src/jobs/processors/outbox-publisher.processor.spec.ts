import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { OutboxPublisherProcessor } from './outbox-publisher.processor';

describe('OutboxPublisherProcessor', () => {
  let processor: OutboxPublisherProcessor;
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
        OutboxPublisherProcessor,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    processor = module.get<OutboxPublisherProcessor>(OutboxPublisherProcessor);
  });

  it('S3.1.2: publishes pending outbox event and marks PUBLISHED with processed_at', async () => {
    queryRunner.query
      .mockResolvedValueOnce([
        {
          id: 'outbox-1',
          event_type: 'ORDER_SYNC',
          aggregate_type: 'ORDER',
          aggregate_id: 'ord-100',
          payload: { orderNumber: 'ORD-100' },
          attempts: 0,
          status: 'PENDING',
        },
      ])
      .mockResolvedValueOnce([]); // UPDATE status = 'PUBLISHED'

    const result = await processor.publishBatch('tenant_1');

    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'PUBLISHED', processed_at = NOW()"),
      expect.arrayContaining(['outbox-1']),
    );
    expect(result.publishedCount).toBe(1);
  });

  it('S3.1.2: applies exponential backoff (1m, 5m, 30m, 2h) on failure and marks DEAD after max attempts', async () => {
    // Attempt 1 failure -> backoff 60s
    queryRunner.query
      .mockResolvedValueOnce([
        {
          id: 'outbox-2',
          event_type: 'STOCK_SYNC',
          aggregate_type: 'INVENTORY',
          aggregate_id: 'inv-200',
          payload: { stock: 10 },
          attempts: 0,
          status: 'PENDING',
        },
      ])
      .mockResolvedValueOnce([]); // UPDATE status = 'FAILED', available_at = +60s

    // Mock handler throwing error
    jest.spyOn<any, any>(processor, 'publishSingleEvent').mockRejectedValue(new Error('Network gateway unreachable'));

    const res1 = await processor.publishBatch('tenant_1');
    expect(res1.failedCount).toBe(1);
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining("status = 'FAILED'"),
      expect.arrayContaining(['outbox-2', 1, 60]),
    );

    // After 3 failed attempts (attempts = 3) -> next failure triggers DEAD
    queryRunner.query
      .mockResolvedValueOnce([
        {
          id: 'outbox-dead',
          event_type: 'STOCK_SYNC',
          aggregate_type: 'INVENTORY',
          aggregate_id: 'inv-300',
          payload: { stock: 0 },
          attempts: 3,
          status: 'FAILED',
        },
      ])
      .mockResolvedValueOnce([]); // UPDATE status = 'DEAD'

    const resDead = await processor.publishBatch('tenant_1');
    expect(resDead.deadCount).toBe(1);
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'DEAD'"),
      expect.arrayContaining(['outbox-dead']),
    );
  });
});
