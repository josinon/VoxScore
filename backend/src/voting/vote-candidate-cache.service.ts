import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import {
  voteCandidateCacheEnabled,
  voteCandidateCacheTtlMs,
} from './vote-candidate-cache-env';

/** Campos necessários para validar e gravar um voto. */
export type VoteCandidateSnapshot = {
  id: string;
  active: boolean;
  votingOpen: boolean;
};

const REDIS_KEY_PREFIX = 'voxscore:vote:candidate:';

@Injectable()
export class VoteCandidateCacheService {
  private readonly memory = new Map<
    string,
    { expiresAt: number; value: VoteCandidateSnapshot }
  >();

  constructor(private readonly redis: RedisService) {}

  async get(candidateId: string): Promise<VoteCandidateSnapshot | null> {
    if (!voteCandidateCacheEnabled()) {
      return null;
    }
    if (this.redis.isEnabled()) {
      return this.getFromRedis(candidateId);
    }
    return this.getFromMemory(candidateId);
  }

  async set(snapshot: VoteCandidateSnapshot): Promise<void> {
    if (!voteCandidateCacheEnabled()) {
      return;
    }
    const ttl = voteCandidateCacheTtlMs();
    if (ttl === 0) {
      return;
    }
    if (this.redis.isEnabled()) {
      await this.redis
        .getClient()
        .set(
          this.redisKey(snapshot.id),
          JSON.stringify(snapshot),
          'PX',
          ttl,
        );
      return;
    }
    this.setInMemory(snapshot, ttl);
  }

  async invalidate(candidateId: string): Promise<void> {
    this.memory.delete(candidateId);
    if (!this.redis.isEnabled()) {
      return;
    }
    await this.redis.getClient().del(this.redisKey(candidateId));
  }

  private redisKey(candidateId: string): string {
    return `${REDIS_KEY_PREFIX}${candidateId}`;
  }

  private async getFromRedis(
    candidateId: string,
  ): Promise<VoteCandidateSnapshot | null> {
    const raw = await this.redis.getClient().get(this.redisKey(candidateId));
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as VoteCandidateSnapshot;
    } catch {
      await this.redis.getClient().del(this.redisKey(candidateId));
      return null;
    }
  }

  private getFromMemory(candidateId: string): VoteCandidateSnapshot | null {
    const entry = this.memory.get(candidateId);
    if (!entry) {
      return null;
    }
    if (Date.now() >= entry.expiresAt) {
      this.memory.delete(candidateId);
      return null;
    }
    return structuredClone(entry.value);
  }

  private setInMemory(snapshot: VoteCandidateSnapshot, ttlMs: number): void {
    this.memory.set(snapshot.id, {
      expiresAt: Date.now() + ttlMs,
      value: structuredClone(snapshot),
    });
  }
}
