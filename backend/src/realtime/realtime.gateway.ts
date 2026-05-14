import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { IncomingMessage } from 'node:http';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Repository } from 'typeorm';
import { WebSocket } from 'ws';
import type { JwtPayload } from '../auth/jwt.strategy';
import { User } from '../entities/user.entity';
import { RealtimeHubService } from './realtime-hub.service';

@WebSocketGateway({ path: '/api/v1/ws' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly hub: RealtimeHubService,
  ) {}

  async handleConnection(client: WebSocket, request: IncomingMessage): Promise<void> {
    try {
      const host = request.headers.host ?? '127.0.0.1';
      const url = new URL(request.url ?? '/', `http://${host}`);
      const token = url.searchParams.get('token');
      if (!token) {
        client.close(1008, 'Unauthorized');
        return;
      }
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user = await this.users.findOne({ where: { id: payload.sub } });
      if (!user || user.disabled) {
        client.close(1008, 'Unauthorized');
        return;
      }
      this.hub.register(client);
    } catch (e) {
      this.logger.debug(`WS connection rejected: ${String(e)}`);
      client.close(1008, 'Unauthorized');
    }
  }

  handleDisconnect(client: WebSocket): void {
    this.hub.unregister(client);
  }
}
