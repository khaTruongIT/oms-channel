import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WebhooksService } from './webhooks.service';
import { WebhookOrderDto } from './dto/webhook-order.dto';

export interface InboxProcessOptions {
  batchSize?: number;
  messageTimeoutMs?: number;
  maxAttempts?: number;
}

export interface InboxProcessResult {
  processedCount: number;
  failedCount: number;
  deadCount: number;
}

interface WebhookInboxRow {
  id: string;
  channel_account_id: string;
  provider: string;
  delivery_id: string;
  payload: Record<string, unknown>;
  attempt_count: number;
  status: string;
}

@Injectable()
export class InboxProcessor {
  private readonly logger = new Logger(InboxProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly webhooksService: WebhooksService,
  ) {}

  async processBatch(
    schemaName: string,
    options?: InboxProcessOptions,
  ): Promise<InboxProcessResult> {
    const batchSize = options?.batchSize ?? 10;
    const messageTimeoutMs = options?.messageTimeoutMs ?? 5000;
    const maxAttempts = options?.maxAttempts ?? 3;

    const result: InboxProcessResult = {
      processedCount: 0,
      failedCount: 0,
      deadCount: 0,
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      const rows = (await queryRunner.query(
        `SELECT id, channel_account_id, provider, delivery_id, payload, attempt_count, status
         FROM "${schemaName}".webhook_inbox
         WHERE status IN ('RECEIVED', 'FAILED')
           AND attempt_count < $1
         ORDER BY received_at ASC
         LIMIT $2
         FOR UPDATE SKIP LOCKED`,
        [maxAttempts, batchSize],
      )) as WebhookInboxRow[];

      await queryRunner.commitTransaction();

      if (rows.length === 0) {
        return result;
      }

      this.logger.log(
        `InboxProcessor: Picked ${rows.length} messages for schema ${schemaName}`,
      );

      // Process each message sequentially without letting any single failure throw out of the loop
      for (const row of rows) {
        try {
          await this.processSingleMessageWithTimeout(
            row,
            schemaName,
            messageTimeoutMs,
          );

          // Success: Mark PROCESSED
          await queryRunner.query(
            `UPDATE "${schemaName}".webhook_inbox
             SET status = 'PROCESSED', processed_at = NOW(), last_error = NULL
             WHERE id = $1`,
            [row.id],
          );

          result.processedCount++;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const nextAttempt = Number(row.attempt_count || 0) + 1;
          const isPoison = nextAttempt >= maxAttempts;

          this.logger.error(
            `Error processing inbox message ${row.id} (attempt ${nextAttempt}/${maxAttempts}): ${errorMessage}`,
          );

          if (isPoison) {
            // S3.1.1: Poison message -> Mark DEAD
            await queryRunner.query(
              `UPDATE "${schemaName}".webhook_inbox
               SET status = 'DEAD', attempt_count = $2, last_error = $3, processed_at = NOW()
               WHERE id = $1`,
              [row.id, nextAttempt, errorMessage.slice(0, 500)],
            );
            result.deadCount++;
          } else {
            // Transient failure -> Mark FAILED for retry
            await queryRunner.query(
              `UPDATE "${schemaName}".webhook_inbox
               SET status = 'FAILED', attempt_count = $2, last_error = $3
               WHERE id = $1`,
              [row.id, nextAttempt, errorMessage.slice(0, 500)],
            );
            result.failedCount++;
          }
        }
      }

      return result;
    } catch (criticalError: unknown) {
      this.logger.error(
        `Critical error acquiring inbox batch for ${schemaName}:`,
        criticalError,
      );
      return result;
    } finally {
      await queryRunner.release();
    }
  }

  private async processSingleMessageWithTimeout(
    row: WebhookInboxRow,
    schemaName: string,
    timeoutMs: number,
  ): Promise<void> {
    let timeoutTimer: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutTimer = setTimeout(() => {
        reject(
          new Error(`Message processing timed out after ${timeoutMs}ms`),
        );
      }, timeoutMs);
    });

    const executionPromise = (async () => {
      const payload = row.payload as unknown as WebhookOrderDto;
      if (!payload || !payload.orderId || !payload.channel) {
        throw new Error('Invalid or incomplete webhook payload');
      }

      // Delegate to webhook order handler with system actor ID
      const userId = '00000000-0000-0000-0000-000000000001';
      await this.webhooksService.handleOrderWebhook(
        payload,
        schemaName,
        userId,
      );
    })();

    try {
      await Promise.race([executionPromise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutTimer!);
    }
  }
}
