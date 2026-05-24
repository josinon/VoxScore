import { WebSocket } from 'ws';
import type { RedisService } from '../redis/redis.service';
import { RealtimeHubService } from './realtime-hub.service';

function mockWs(readyState: number, sendImpl = jest.fn()) {
  return { readyState, send: sendImpl } as unknown as WebSocket;
}

function mockRedis(): RedisService {
  return {
    isEnabled: () => false,
    onRealtimeMessage: jest.fn(),
    onRankingDebounceExpired: jest.fn(),
  } as unknown as RedisService;
}

describe('RealtimeHubService', () => {
  const prevDebounce = process.env.REALTIME_RANKING_DEBOUNCE_MS;

  beforeEach(() => {
    process.env.REALTIME_RANKING_DEBOUNCE_MS = '0';
  });

  afterAll(() => {
    if (prevDebounce === undefined) {
      delete process.env.REALTIME_RANKING_DEBOUNCE_MS;
    } else {
      process.env.REALTIME_RANKING_DEBOUNCE_MS = prevDebounce;
    }
  });

  it('broadcastCandidatesChanged envia JSON só a clientes OPEN', () => {
    const hub = new RealtimeHubService(mockRedis());
    const openSend = jest.fn();
    const closedSend = jest.fn();
    const open = mockWs(WebSocket.OPEN, openSend);
    const closed = mockWs(WebSocket.CLOSED, closedSend);
    hub.register(open);
    hub.register(closed);
    hub.broadcastCandidatesChanged();
    expect(openSend).toHaveBeenCalledTimes(1);
    expect(openSend).toHaveBeenCalledWith(
      JSON.stringify({ type: 'candidates_changed' }),
    );
    expect(closedSend).not.toHaveBeenCalled();
  });

  it('broadcastRankingChanged envia o tipo ranking_changed', () => {
    const hub = new RealtimeHubService(mockRedis());
    const send = jest.fn();
    hub.register(mockWs(WebSocket.OPEN, send));
    hub.broadcastRankingChanged();
    expect(send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'ranking_changed' }),
    );
  });

  it('debounces broadcastRankingChanged quando REALTIME_RANKING_DEBOUNCE_MS > 0', () => {
    jest.useFakeTimers();
    process.env.REALTIME_RANKING_DEBOUNCE_MS = '500';
    const hub = new RealtimeHubService(mockRedis());
    const send = jest.fn();
    hub.register(mockWs(WebSocket.OPEN, send));

    hub.broadcastRankingChanged();
    hub.broadcastRankingChanged();
    hub.broadcastRankingChanged();
    expect(send).not.toHaveBeenCalled();

    jest.advanceTimersByTime(499);
    expect(send).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'ranking_changed' }),
    );

    hub.onModuleDestroy();
    jest.useRealTimers();
    process.env.REALTIME_RANKING_DEBOUNCE_MS = '0';
  });

  it('unregister impede broadcasts a esse cliente', () => {
    const hub = new RealtimeHubService(mockRedis());
    const send = jest.fn();
    const client = mockWs(WebSocket.OPEN, send);
    hub.register(client);
    hub.unregister(client);
    hub.broadcastCandidatesChanged();
    expect(send).not.toHaveBeenCalled();
  });

  it('send falhado não rebenta o broadcast aos outros', () => {
    const hub = new RealtimeHubService(mockRedis());
    const badSend = jest.fn(() => {
      throw new Error('network');
    });
    const goodSend = jest.fn();
    hub.register(mockWs(WebSocket.OPEN, badSend));
    hub.register(mockWs(WebSocket.OPEN, goodSend));
    hub.broadcastCandidatesChanged();
    expect(goodSend).toHaveBeenCalledTimes(1);
  });
});
