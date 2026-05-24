import { Injectable } from '@nestjs/common';
import {
  REDIS_KEY_RANKING_CACHE_COUNTS,
  REDIS_KEY_RANKING_CACHE_SCORES,
} from '../redis/redis.constants';
import { RedisService } from '../redis/redis.service';
import { rankingCacheEnabled, rankingCacheTtlMs } from './ranking-cache-env';
import type { RankingResponseDto } from './dto/ranking-response.dto';

export type RankingCacheView = 'scores' | 'counts';

const REDIS_KEY: Record<RankingCacheView, string> = {
  scores: REDIS_KEY_RANKING_CACHE_SCORES,
  counts: REDIS_KEY_RANKING_CACHE_COUNTS,
};

@Injectable()
export class RankingCacheService {
  private readonly memory = new Map<
    RankingCacheView,
    { expiresAt: number; value: RankingResponseDto }
  >();

  constructor(private readonly redis: RedisService) {}

  async get(view: RankingCacheView): Promise<RankingResponseDto | null> {
    if (!rankingCacheEnabled()) {
      return null;
    }
    if (this.redis.isEnabled()) {
      return this.getFromRedis(view);
    }
    return this.getFromMemory(view);
  }

  async set(view: RankingCacheView, value: RankingResponseDto): Promise<void> {
    if (!rankingCacheEnabled()) {
      return;
    }
    const ttl = rankingCacheTtlMs();
    if (ttl === 0) {
      return;
    }
    if (this.redis.isEnabled()) {
      await this.redis
        .getClient()
        .set(REDIS_KEY[view], JSON.stringify(value), 'PX', ttl);
      return;
    }
    this.setInMemory(view, value, ttl);
  }

  async invalidate(): Promise<void> {
    this.memory.clear();
    if (!this.redis.isEnabled()) {
      return;
    }
    await this.redis
      .getClient()
      .del(REDIS_KEY_RANKING_CACHE_SCORES, REDIS_KEY_RANKING_CACHE_COUNTS);
  }

  private async getFromRedis(
    view: RankingCacheView,
  ): Promise<RankingResponseDto | null> {
    const raw = await this.redis.getClient().get(REDIS_KEY[view]);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as RankingResponseDto;
    } catch {
      await this.redis.getClient().del(REDIS_KEY[view]);
      return null;
    }
  }

  private getFromMemory(view: RankingCacheView): RankingResponseDto | null {
    const entry = this.memory.get(view);
    if (!entry) {
      return null;
    }
    if (Date.now() >= entry.expiresAt) {
      this.memory.delete(view);
      return null;
    }
    return structuredClone(entry.value);
  }

  private setInMemory(
    view: RankingCacheView,
    value: RankingResponseDto,
    ttlMs: number,
  ): void {
    this.memory.set(view, {
      expiresAt: Date.now() + ttlMs,
      value: structuredClone(value),
    });
  }
}
