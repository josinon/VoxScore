import type { RedisService } from '../redis/redis.service';
import { RankingCacheService } from './ranking-cache.service';
import type { RankingResponseDto } from './dto/ranking-response.dto';

function sampleDto(overrides: Partial<RankingResponseDto> = {}): RankingResponseDto {
  return {
    schemaVersion: 1,
    resultsPublished: false,
    votingMode: 'JUDGES_AND_PUBLIC',
        judgeWeightPercent: 80,
        publicWeightPercent: 20 as RankingResponseDto['votingMode'],
    judgeWeightPercent: 80,
    publicWeightPercent: 20,
    entries: [],
    ...overrides,
  };
}

function mockRedisDisabled(): RedisService {
  return { isEnabled: () => false } as unknown as RedisService;
}

describe('RankingCacheService', () => {
  const prevEnabled = process.env.RANKING_CACHE_ENABLED;
  const prevTtl = process.env.RANKING_CACHE_TTL_MS;

  afterEach(() => {
    if (prevEnabled === undefined) {
      delete process.env.RANKING_CACHE_ENABLED;
    } else {
      process.env.RANKING_CACHE_ENABLED = prevEnabled;
    }
    if (prevTtl === undefined) {
      delete process.env.RANKING_CACHE_TTL_MS;
    } else {
      process.env.RANKING_CACHE_TTL_MS = prevTtl;
    }
    jest.useRealTimers();
  });

  it('returns null when cache disabled', async () => {
    process.env.RANKING_CACHE_ENABLED = 'false';
    const cache = new RankingCacheService(mockRedisDisabled());
    await cache.set('scores', sampleDto());
    await expect(cache.get('scores')).resolves.toBeNull();
  });

  it('stores and returns a clone in memory (mutations não afetam o cache)', async () => {
    process.env.RANKING_CACHE_ENABLED = 'true';
    process.env.RANKING_CACHE_TTL_MS = '60000';
    const cache = new RankingCacheService(mockRedisDisabled());
    const dto = sampleDto({ resultsPublished: true });
    await cache.set('scores', dto);
    const hit = await cache.get('scores');
    expect(hit).toEqual(dto);
    hit!.resultsPublished = false;
    await expect(cache.get('scores')).resolves.toMatchObject({
      resultsPublished: true,
    });
  });

  it('expires in-memory entries after TTL', async () => {
    jest.useFakeTimers();
    process.env.RANKING_CACHE_ENABLED = 'true';
    process.env.RANKING_CACHE_TTL_MS = '1000';
    const cache = new RankingCacheService(mockRedisDisabled());
    await cache.set('counts', sampleDto());
    await expect(cache.get('counts')).resolves.not.toBeNull();
    jest.advanceTimersByTime(1001);
    await expect(cache.get('counts')).resolves.toBeNull();
  });

  it('invalidate clears all views', async () => {
    process.env.RANKING_CACHE_ENABLED = 'true';
    process.env.RANKING_CACHE_TTL_MS = '60000';
    const cache = new RankingCacheService(mockRedisDisabled());
    await cache.set('scores', sampleDto());
    await cache.set('counts', sampleDto());
    await cache.invalidate();
    await expect(cache.get('scores')).resolves.toBeNull();
    await expect(cache.get('counts')).resolves.toBeNull();
  });
});
