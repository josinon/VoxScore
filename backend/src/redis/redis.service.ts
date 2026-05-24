import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import {
  REDIS_KEY_RANKING_DEBOUNCE,
  REDIS_REALTIME_CHANNEL,
  type RealtimeChannelMessage,
} from './redis.constants';
import { redisRequired, redisUrl } from './redis-env';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private readonly realtimeHandlers = new Set<
    (msg: RealtimeChannelMessage) => void
  >();
  private readonly rankingDebounceHandlers = new Set<() => void>();

  isEnabled(): boolean {
    return this.client !== null;
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis is not configured (set REDIS_URL)');
    }
    return this.client;
  }

  onRealtimeMessage(handler: (msg: RealtimeChannelMessage) => void): void {
    this.realtimeHandlers.add(handler);
  }

  onRankingDebounceExpired(handler: () => void): void {
    this.rankingDebounceHandlers.add(handler);
  }

  async onModuleInit(): Promise<void> {
    const url = redisUrl();
    if (!url) {
      this.logger.warn(
        'REDIS_URL not set — cache e WebSocket usam fallback em memória (apenas 1 réplica).',
      );
      return;
    }

    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    this.subscriber = this.client.duplicate();

    this.client.on('error', (err) => {
      this.logger.error(`Redis client error: ${String(err)}`);
    });
    this.subscriber.on('error', (err) => {
      this.logger.error(`Redis subscriber error: ${String(err)}`);
    });

    try {
      await this.client.ping();
      await this.setupSubscriber();
      this.logger.log('Redis connected (shared cache and realtime).');
    } catch (err) {
      await this.disconnect();
      const msg = `Redis connection failed: ${String(err)}`;
      if (redisRequired()) {
        throw new Error(msg);
      }
      this.logger.error(`${msg} Continuing without Redis.`);
      this.client = null;
      this.subscriber = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  async ping(): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.ping();
  }

  async publishRealtime(message: RealtimeChannelMessage): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.publish(REDIS_REALTIME_CHANNEL, JSON.stringify(message));
  }

  /** Debounce de ranking partilhado entre pods (TTL renovado a cada voto). */
  async refreshRankingDebounceKey(ttlMs: number): Promise<void> {
    if (!this.client || ttlMs <= 0) {
      return;
    }
    await this.client.set(REDIS_KEY_RANKING_DEBOUNCE, '1', 'PX', ttlMs);
  }

  private async setupSubscriber(): Promise<void> {
    if (!this.subscriber) {
      return;
    }

    try {
      await this.subscriber.config('SET', 'notify-keyspace-events', 'Ex');
    } catch (e) {
      this.logger.warn(
        `Could not SET notify-keyspace-events (configure Redis server with --notify-keyspace-events Ex): ${String(e)}`,
      );
    }

    await this.subscriber.subscribe(REDIS_REALTIME_CHANNEL);
    await this.subscriber.psubscribe('__keyevent@*__:expired');

    this.subscriber.on('message', (channel, raw) => {
      if (channel !== REDIS_REALTIME_CHANNEL) {
        return;
      }
      this.dispatchRealtime(raw);
    });

    this.subscriber.on('pmessage', (_pattern, _channel, key) => {
      if (key === REDIS_KEY_RANKING_DEBOUNCE) {
        for (const handler of this.rankingDebounceHandlers) {
          handler();
        }
      }
    });
  }

  private dispatchRealtime(raw: string): void {
    try {
      const msg = JSON.parse(raw) as RealtimeChannelMessage;
      if (msg.type !== 'candidates_changed' && msg.type !== 'ranking_changed') {
        return;
      }
      for (const handler of this.realtimeHandlers) {
        handler(msg);
      }
    } catch {
      /* ignore malformed */
    }
  }

  private async disconnect(): Promise<void> {
    const subs = this.subscriber;
    const main = this.client;
    this.subscriber = null;
    this.client = null;
    await Promise.all([
      subs?.quit().catch(() => undefined),
      main?.quit().catch(() => undefined),
    ]);
  }
}
