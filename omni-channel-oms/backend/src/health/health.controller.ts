import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import type { LivenessStatus, ReadinessStatus } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Process is alive' })
  @Get('live')
  live(): LivenessStatus {
    return this.healthService.getLiveness();
  }

  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service dependencies are ready' })
  @ApiResponse({
    status: 503,
    description: 'Service dependencies are not ready',
  })
  @Get('ready')
  ready(): Promise<ReadinessStatus> {
    return this.healthService.getReadiness();
  }
}
