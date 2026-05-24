import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { WebSocket } from 'ws';
import { RedisService } from '../redis/redis.service';
import type { RealtimeChannelMessage } from '../redis/redis.constants';
import { rankingBroadcastDebounceMs } from './realtime-env';

@Injectable()
export class RealtimeHubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeHubService.name);
  private readonly clients = new Set<WebSocket>();
  private rankingBroadcastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly redis: RedisService) {}

  onModuleInit(): void {
    if (!this.redis.isEnabled()) {
      return;
    }
    this.redis.onRealtimeMessage((msg) => this.handleClusterRealtime(msg));
    this.redis.onRankingDebounceExpired(() => {
      this.emitRankingChanged();
    });
  }

  register(client: WebSocket): void {
    this.clients.add(client);
  }

  unregister(client: WebSocket): void {
    this.clients.delete(client);
  }

  broadcastCandidatesChanged(): void {
    if (this.redis.isEnabled()) {
      void this.redis.publishRealtime({ type: 'candidates_changed' });
      return;
    }
    this.emitCandidatesChanged();
  }

  /** Debounce partilhado via Redis (vários pods) ou local (sem Redis). */
  broadcastRankingChanged(): void {
    const debounceMs = rankingBroadcastDebounceMs();
    if (this.redis.isEnabled()) {
      if (debounceMs === 0) {
        void this.redis.publishRealtime({ type: 'ranking_changed' });
        return;
      }
      void this.redis.refreshRankingDebounceKey(debounceMs);
      return;
    }
    this.scheduleLocalRankingBroadcast(debounceMs);
  }

  onModuleDestroy(): void {
    if (this.rankingBroadcastTimer !== null) {
      clearTimeout(this.rankingBroadcastTimer);
      this.rankingBroadcastTimer = null;
    }
  }

  private handleClusterRealtime(msg: RealtimeChannelMessage): void {
    if (msg.type === 'candidates_changed') {
      this.emitCandidatesChanged();
    } else if (msg.type === 'ranking_changed') {
      this.emitRankingChanged();
    }
  }

  private scheduleLocalRankingBroadcast(debounceMs: number): void {
    if (debounceMs === 0) {
      this.emitRankingChanged();
      return;
    }
    if (this.rankingBroadcastTimer !== null) {
      clearTimeout(this.rankingBroadcastTimer);
    }
    this.rankingBroadcastTimer = setTimeout(() => {
      this.rankingBroadcastTimer = null;
      this.emitRankingChanged();
    }, debounceMs);
  }

  private emitCandidatesChanged(): void {
    this.broadcast({ type: 'candidates_changed' });
  }

  private emitRankingChanged(): void {
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
