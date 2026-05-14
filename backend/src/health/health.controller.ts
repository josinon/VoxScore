import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  /**
   * Liveness/readiness: retorna 200 apenas se o PostgreSQL responder ao ping.
   * Caminho completo: `GET /api/v1/health` (prefixo global no `main.ts`).
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
