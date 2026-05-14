import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import WebSocket from 'ws';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/common/user-role.enum';
import { User } from '../src/entities/user.entity';
import { configureNestWs } from './configure-nest-ws';

const describeOrSkip = process.env.DATABASE_URL ? describe : describe.skip;

function candidatePayload(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    musicTitle: 'Song',
    genre: 'Pop',
    bio: 'Bio.',
    photoUrl: 'https://example.com/p.jpg',
    instagramUrl: null,
    youtubeUrl: null,
    votingOpen: false,
    displayOrder: 0,
    active: true,
    ...overrides,
  };
}

function wsUrlFromHttpBase(httpBase: string, token: string | undefined) {
  const u = new URL(httpBase);
  const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
  const query = token != null ? `?token=${encodeURIComponent(token)}` : '';
  return `${wsProto}//${u.host}/api/v1/ws${query}`;
}

function waitOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('WS open timeout')), 8000);
    ws.once('open', () => {
      clearTimeout(t);
      resolve();
    });
    ws.once('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

function waitClose(ws: WebSocket): Promise<{ code: number }> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('WS close timeout')), 8000);
    ws.once('close', (code) => {
      clearTimeout(t);
      resolve({ code });
    });
    ws.once('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

function nextMessageJson(ws: WebSocket, ms: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('WS message timeout')), ms);
    ws.once('message', (data) => {
      clearTimeout(t);
      try {
        resolve(JSON.parse(String(data)));
      } catch (e) {
        reject(e);
      }
    });
  });
}

describeOrSkip('Realtime WebSocket (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let httpBase: string;
  let adminToken: string;
  let publicToken: string;
  const adminEmail =
    process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@voxscore.local';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureNestWs(app);
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer() as Server;
    await app.listen(0);
    httpBase = await app.getUrl();

    const ds = app.get(DataSource);
    const publicEmail = `ws-pub-${Date.now()}@voxscore.test`;
    await ds.getRepository(User).save({
      email: publicEmail,
      displayName: 'WS Public',
      role: UserRole.PUBLIC,
      disabled: false,
      photoUrl: null,
    });

    const ta = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: adminEmail })
      .expect(200);
    adminToken = (ta.body as { accessToken: string }).accessToken;

    const tp = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: publicEmail })
      .expect(200);
    publicToken = (tp.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('WS sem token: conexão fecha com 1008', async () => {
    const ws = new WebSocket(wsUrlFromHttpBase(httpBase, undefined));
    const { code } = await waitClose(ws);
    expect(code).toBe(1008);
  });

  it('WS com token inválido: conexão fecha com 1008', async () => {
    const ws = new WebSocket(wsUrlFromHttpBase(httpBase, 'não-é-um-jwt'));
    const { code } = await waitClose(ws);
    expect(code).toBe(1008);
  });

  it('WS autenticado recebe candidates_changed após POST candidato (ADMIN)', async () => {
    const ws = new WebSocket(wsUrlFromHttpBase(httpBase, publicToken));
    await waitOpen(ws);
    const msgP = nextMessageJson(ws, 15000);
    await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(candidatePayload(`WS-cand-${Date.now()}`))
      .expect(201);
    await expect(msgP).resolves.toEqual({ type: 'candidates_changed' });
    ws.close();
  });

  it('WS autenticado recebe ranking_changed após submeter voto', async () => {
    const create = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(candidatePayload(`WS-vote-${Date.now()}`, { votingOpen: true }))
      .expect(201);
    const id = (create.body as { id: string }).id;

    const ws = new WebSocket(wsUrlFromHttpBase(httpBase, publicToken));
    await waitOpen(ws);

    const msgP = nextMessageJson(ws, 15000);
    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({
        criteriaScores: {
          entertainment: 8,
          emotion: 7,
          likedTheMusic: 9,
          wouldListenAgain: 8,
        },
      })
      .expect(201);

    await expect(msgP).resolves.toEqual({ type: 'ranking_changed' });
    ws.close();
  });
});
