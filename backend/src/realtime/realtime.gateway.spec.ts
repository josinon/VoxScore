import type { IncomingMessage } from 'node:http';
import { JwtService } from '@nestjs/jwt';
import type { Repository } from 'typeorm';
import { WebSocket } from 'ws';
import { User } from '../entities/user.entity';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeHubService } from './realtime-hub.service';

describe('RealtimeGateway', () => {
  let hub: { register: jest.Mock; unregister: jest.Mock };
  let jwt: { verifyAsync: jest.Mock };
  let users: { findOne: jest.Mock };
  let gateway: RealtimeGateway;

  beforeEach(() => {
    hub = { register: jest.fn(), unregister: jest.fn() };
    jwt = { verifyAsync: jest.fn() };
    users = { findOne: jest.fn() };
    gateway = new RealtimeGateway(
      jwt as unknown as JwtService,
      users as unknown as Repository<User>,
      hub as unknown as RealtimeHubService,
    );
  });

  function req(url: string, host = '127.0.0.1:3000'): IncomingMessage {
    return { url, headers: { host } } as IncomingMessage;
  }

  it('sem query token → close 1008 e não regista', async () => {
    const client = { close: jest.fn() } as unknown as WebSocket;
    await gateway.handleConnection(client, req('/api/v1/ws'));
    expect(client.close).toHaveBeenCalledWith(1008, 'Unauthorized');
    expect(hub.register).not.toHaveBeenCalled();
  });

  it('token inválido → close 1008', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad'));
    const client = { close: jest.fn() } as unknown as WebSocket;
    await gateway.handleConnection(
      client,
      req(`/api/v1/ws?token=${encodeURIComponent('x.y.z')}`),
    );
    expect(client.close).toHaveBeenCalledWith(1008, 'Unauthorized');
    expect(hub.register).not.toHaveBeenCalled();
  });

  it('utilizador inexistente ou disabled → close 1008', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-id' });
    users.findOne.mockResolvedValue(null);
    const client = { close: jest.fn() } as unknown as WebSocket;
    await gateway.handleConnection(
      client,
      req(`/api/v1/ws?token=${encodeURIComponent('valid.jwt')}`),
    );
    expect(client.close).toHaveBeenCalledWith(1008, 'Unauthorized');
    expect(hub.register).not.toHaveBeenCalled();
  });

  it('JWT válido e utilizador ativo → regista no hub', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-id' });
    users.findOne.mockResolvedValue({
      id: 'user-id',
      disabled: false,
    });
    const client = { close: jest.fn() } as unknown as WebSocket;
    await gateway.handleConnection(
      client,
      req(`/api/v1/ws?token=${encodeURIComponent('valid.jwt')}`),
    );
    expect(client.close).not.toHaveBeenCalled();
    expect(hub.register).toHaveBeenCalledWith(client);
  });

  it('handleDisconnect remove o cliente do hub', () => {
    const client = {} as WebSocket;
    gateway.handleDisconnect(client);
    expect(hub.unregister).toHaveBeenCalledWith(client);
  });
});
