import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisService,
  ) {}

  /**
   * Liveness/readiness: PostgreSQL e Redis (quando `REDIS_URL` definido).
   * Caminho completo: `GET /api/v1/health` (prefixo global no `main.ts`).
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkRedis(),
    ]);
  }

  private async checkRedis() {
    if (!this.redis.isEnabled()) {
      return { redis: { status: 'up' as const, message: 'not configured' } };
    }
    try {
      await this.redis.ping();
      return { redis: { status: 'up' as const } };
    } catch (e) {
      throw new HealthCheckError('Redis ping failed', {
        redis: { status: 'down', message: String(e) },
      });
    }
  }
}
