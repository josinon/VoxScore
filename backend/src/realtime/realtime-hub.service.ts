import { Injectable, Logger } from '@nestjs/common';
import { WebSocket } from 'ws';

@Injectable()
export class RealtimeHubService {
  private readonly logger = new Logger(RealtimeHubService.name);
  private readonly clients = new Set<WebSocket>();

  register(client: WebSocket): void {
    this.clients.add(client);
  }

  unregister(client: WebSocket): void {
    this.clients.delete(client);
  }

  broadcastCandidatesChanged(): void {
    this.broadcast({ type: 'candidates_changed' });
  }

  broadcastRankingChanged(): void {
    this.broadcast({ type: 'ranking_changed' });
  }

  private broadcast(payload: unknown): void {
    const raw = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client.readyState !== WebSocket.OPEN) {
        continue;
      }
      try {
        client.send(raw);
      } catch (e) {
        this.logger.warn(`WebSocket send failed: ${String(e)}`);
      }
    }
  }
}
