import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export const OUTBOX_BACKOFF_SECONDS = [60, 300, 1800, 7200]; // 1m, 5m, 30m, 2h

export interface OutboxPublishResult {
  publishedCount: number;
  failedCount: number;
  deadCount: number;
}

interface OutboxEventRow {
  id: string;
  channel_account_id: string | null;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: Record<string, unknown>;
  attempts: number;
  status: string;
}

@Injectable()
export class OutboxPublisherProcessor {
  private readonly logger = new Logger(OutboxPublisherProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  async publishBatch(
    schemaName: string,
    limit = 20,
  ): Promise<OutboxPublishResult> {
    const result: OutboxPublishResult = {
      publishedCount: 0,
      failedCount: 0,
      deadCount: 0,
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // S3.1.2: Select pending or retryable outbox events using FOR UPDATE SKIP LOCKED
      const rows = (await queryRunner.query(
        `SELECT id, channel_account_id, event_type, aggregate_type, aggregate_id, payload, attempts, status
         FROM "${schemaName}".outbox_events
         WHERE status IN ('PENDING', 'FAILED')
           AND available_at <= NOW()
           AND attempts < $1
         ORDER BY created_at ASC
         LIMIT $2
         FOR UPDATE SKIP LOCKED`,
        [OUTBOX_BACKOFF_SECONDS.length, limit],
      )) as OutboxEventRow[];

      await queryRunner.commitTransaction();

      if (rows.length === 0) {
        return result;
      }

      this.logger.log(
        `OutboxPublisher: Picked ${rows.length} events for schema ${schemaName}`,
      );

      for (const row of rows) {
        try {
          await this.publishSingleEvent(row, schemaName);

          // Success: Mark PUBLISHED with processed_at
          await queryRunner.query(
            `UPDATE "${schemaName}".outbox_events
             SET status = 'PUBLISHED', processed_at = NOW(), last_error = NULL
             WHERE id = $1`,
            [row.id],
          );
          result.publishedCount++;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const currentAttempts = Number(row.attempts || 0);
          const nextAttempts = currentAttempts + 1;

          this.logger.error(
            `Outbox event ${row.id} publishing failed (attempt ${nextAttempts}/${OUTBOX_BACKOFF_SECONDS.length}): ${errorMessage}`,
          );

          if (nextAttempts >= OUTBOX_BACKOFF_SECONDS.length) {
            // S3.1.2: Reached maximum retries -> Mark DEAD
            await queryRunner.query(
              `UPDATE "${schemaName}".outbox_events
               SET status = 'DEAD', attempts = $2, last_error = $3, processed_at = NOW()
               WHERE id = $1`,
              [row.id, nextAttempts, errorMessage.slice(0, 500)],
            );
            result.deadCount++;
          } else {
            // S3.1.2: Exponential backoff interval (1m, 5m, 30m, 2h)
            const backoffSeconds = OUTBOX_BACKOFF_SECONDS[currentAttempts];
            await queryRunner.query(
              `UPDATE "${schemaName}".outbox_events
               SET status = 'FAILED',
                   attempts = $2,
                   available_at = NOW() + make_interval(secs => $3),
                   last_error = $4
               WHERE id = $1`,
              [row.id, nextAttempts, backoffSeconds, errorMessage.slice(0, 500)],
            );
            result.failedCount++;
          }
        }
      }

      return result;
    } catch (criticalError: unknown) {
      this.logger.error(
        `Critical error executing outbox publisher for ${schemaName}:`,
        criticalError,
      );
      return result;
    } finally {
      await queryRunner.release();
    }
  }

  protected async publishSingleEvent(
    event: OutboxEventRow,
    _schemaName: string,
  ): Promise<void> {
    // Dispatch/publish logic for external delivery
    this.logger.debug(
      `Publishing outbox event ${event.event_type} (${event.aggregate_type}:${event.aggregate_id})`,
    );
  }
}
