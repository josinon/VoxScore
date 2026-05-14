import { WebSocket } from 'ws';
import { RealtimeHubService } from './realtime-hub.service';

function mockWs(readyState: number, sendImpl = jest.fn()) {
  return { readyState, send: sendImpl } as unknown as WebSocket;
}

describe('RealtimeHubService', () => {
  it('broadcastCandidatesChanged envia JSON só a clientes OPEN', () => {
    const hub = new RealtimeHubService();
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
    const hub = new RealtimeHubService();
    const send = jest.fn();
    hub.register(mockWs(WebSocket.OPEN, send));
    hub.broadcastRankingChanged();
    expect(send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'ranking_changed' }),
    );
  });

  it('unregister impede broadcasts a esse cliente', () => {
    const hub = new RealtimeHubService();
    const send = jest.fn();
    const client = mockWs(WebSocket.OPEN, send);
    hub.register(client);
    hub.unregister(client);
    hub.broadcastCandidatesChanged();
    expect(send).not.toHaveBeenCalled();
  });

  it('send falhado não rebenta o broadcast aos outros', () => {
    const hub = new RealtimeHubService();
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
