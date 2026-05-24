import type { RedisService } from '../redis/redis.service';
import { VoteCandidateCacheService } from './vote-candidate-cache.service';

function mockRedisDisabled(): RedisService {
  return { isEnabled: () => false } as unknown as RedisService;
}

describe('VoteCandidateCacheService', () => {
  const prevEnabled = process.env.VOTE_CANDIDATE_CACHE_ENABLED;
  const prevTtl = process.env.VOTE_CANDIDATE_CACHE_TTL_MS;

  afterEach(() => {
    if (prevEnabled === undefined) {
      delete process.env.VOTE_CANDIDATE_CACHE_ENABLED;
    } else {
      process.env.VOTE_CANDIDATE_CACHE_ENABLED = prevEnabled;
    }
    if (prevTtl === undefined) {
      delete process.env.VOTE_CANDIDATE_CACHE_TTL_MS;
    } else {
      process.env.VOTE_CANDIDATE_CACHE_TTL_MS = prevTtl;
    }
    jest.useRealTimers();
  });

  it('returns null when cache disabled', async () => {
    process.env.VOTE_CANDIDATE_CACHE_ENABLED = 'false';
    const cache = new VoteCandidateCacheService(mockRedisDisabled());
    await cache.set({ id: 'c1', active: true, votingOpen: true });
    await expect(cache.get('c1')).resolves.toBeNull();
  });

  it('stores snapshot in memory until TTL', async () => {
    jest.useFakeTimers();
    process.env.VOTE_CANDIDATE_CACHE_ENABLED = 'true';
    process.env.VOTE_CANDIDATE_CACHE_TTL_MS = '5000';
    const cache = new VoteCandidateCacheService(mockRedisDisabled());
    const snap = { id: 'c1', active: true, votingOpen: false };
    await cache.set(snap);
    await expect(cache.get('c1')).resolves.toEqual(snap);
    jest.advanceTimersByTime(5001);
    await expect(cache.get('c1')).resolves.toBeNull();
  });

  it('invalidate removes entry', async () => {
    process.env.VOTE_CANDIDATE_CACHE_ENABLED = 'true';
    process.env.VOTE_CANDIDATE_CACHE_TTL_MS = '60000';
    const cache = new VoteCandidateCacheService(mockRedisDisabled());
    await cache.set({ id: 'c2', active: true, votingOpen: true });
    await cache.invalidate('c2');
    await expect(cache.get('c2')).resolves.toBeNull();
  });
});
