import { Injectable, ServiceUnavailableException } from '@nestjs/common';
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
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  getLiveness(): LivenessStatus {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
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
