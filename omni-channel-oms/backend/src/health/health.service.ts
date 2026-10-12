import {
  Injectable,
  ServiceUnavailableException,
  BeforeApplicationShutdown,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface LivenessStatus {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}

export interface ReadinessStatus {
  status: 'ok';
  checks: {
    database: 'ok';
  };
  timestamp: string;
}

@Injectable()
export class HealthService implements BeforeApplicationShutdown {
  private isShuttingDown = false;

  constructor(private readonly dataSource: DataSource) {}

  beforeApplicationShutdown(_signal?: string) {
    this.isShuttingDown = true;
  }

  getLiveness(): LivenessStatus {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    if (this.isShuttingDown) {
      throw new ServiceUnavailableException({
        message: 'Service is shutting down',
        checks: {
          database: 'shutting_down',
        },
      });
    }

    try {
      await this.dataSource.query('SELECT 1 AS ok');
    } catch {
      throw new ServiceUnavailableException({
        message: 'Service is not ready',
        checks: {
          database: 'error',
        },
      });
    }

    return {
      status: 'ok',
      checks: {
        database: 'ok',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
