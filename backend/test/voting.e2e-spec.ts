import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureNestWs } from './configure-nest-ws';
import { resolveAdminEmail } from './helpers/e2e-admin';
import { UserRole } from '../src/common/user-role.enum';
import { User } from '../src/entities/user.entity';
import { VOTE_CRITERIA } from '../src/voting/voting.constants';

const describeOrSkip = process.env.DATABASE_URL ? describe : describe.skip;

const voteScores = () => ({
  scriptDevelopment: 8,
  creativity: 7,
  synchronism: 9,
  originalityAndMusicality: 8,
});

const publicScores = voteScores;
const judgeScores = voteScores;

function validCandidate(name: string, overrides: Record<string, unknown> = {}) {
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

describeOrSkip('Voting (e2e) — Fase 5 (T5.1–T5.6)', () => {
  let app: INestApplication;
  let server: Server;
  let adminToken: string;
  let publicToken: string;
  let judgeToken: string;

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

    const ds = app.get(DataSource);
    const adminEmail = await resolveAdminEmail(ds);

    const publicEmail = `vote-pub-${Date.now()}@voxscore.test`;
    await ds.getRepository(User).save({
      email: publicEmail,
      displayName: 'Public Voter',
      role: UserRole.PUBLIC,
      disabled: false,
      photoUrl: null,
    });

    const judgeEmail = `vote-judge-${Date.now()}@voxscore.test`;
    await ds.getRepository(User).save({
      email: judgeEmail,
      displayName: 'Judge',
      role: UserRole.JUDGE,
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

    const tj = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: judgeEmail })
      .expect(200);
    judgeToken = (tj.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('T5.5 — ADMIN não pode votar → 403', async () => {
    const create = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCandidate('T5.5', { votingOpen: true }))
      .expect(201);
    const id = (create.body as { id: string }).id;

    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ criteriaScores: publicScores() })
      .expect(403);

    await request(server)
      .delete(`/api/v1/candidates/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });

  it('T5.4 — votação fechada → 403', async () => {
    const create = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCandidate('T5.4', { votingOpen: false }))
      .expect(201);
    const id = (create.body as { id: string }).id;

    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: publicScores() })
      .expect(403);

    await request(server)
      .delete(`/api/v1/candidates/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });

  it('T5.2 — PUBLIC com chaves inválidas (critérios antigos) → 400', async () => {
    const create = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCandidate('T5.2', { votingOpen: true }))
      .expect(201);
    const id = (create.body as { id: string }).id;

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
      .expect(400);

    await request(server)
      .delete(`/api/v1/candidates/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });

  it('T5.3 — JUDGE com 3 critérios → 400', async () => {
    const create = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCandidate('T5.3', { votingOpen: true }))
      .expect(201);
    const id = (create.body as { id: string }).id;

    const incomplete: Record<string, number> = {};
    for (const k of VOTE_CRITERIA.slice(0, 3)) {
      incomplete[k] = 7;
    }

    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${judgeToken}`)
      .send({ criteriaScores: incomplete })
      .expect(400);

    await request(server)
      .delete(`/api/v1/candidates/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });

  it('T5.6 — nota fora do intervalo → 400', async () => {
    const create = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCandidate('T5.6', { votingOpen: true }))
      .expect(201);
    const id = (create.body as { id: string }).id;

    const badLow = { ...publicScores(), scriptDevelopment: 0 };
    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: badLow })
      .expect(400);

    const badHigh = { ...publicScores(), creativity: 11 };
    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: badHigh })
      .expect(400);

    const badStep = { ...publicScores(), synchronism: 8.3 };
    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: badStep })
      .expect(400);

    await request(server)
      .delete(`/api/v1/candidates/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });

  it('T5.1b — notas em passos de 0,5 → 201', async () => {
    const create = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCandidate('T5.1b', { votingOpen: true }))
      .expect(201);
    const id = (create.body as { id: string }).id;

    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({
        criteriaScores: {
          scriptDevelopment: 7.5,
          creativity: 8,
          synchronism: 9.5,
          originalityAndMusicality: 6.5,
        },
      })
      .expect(201);

    await request(server)
      .delete(`/api/v1/candidates/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });

  it('T5.7 — cache candidato: após fechar votação, voto imediato → 403', async () => {
    const create = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCandidate('T5.7', { votingOpen: true }))
      .expect(201);
    const id = (create.body as { id: string }).id;

    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: publicScores() })
      .expect(201);

    await request(server)
      .patch(`/api/v1/candidates/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ votingOpen: false })
      .expect(200);

    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: publicScores() })
      .expect(403);

    await request(server)
      .delete(`/api/v1/candidates/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });

  it('T5.1 — PUBLIC: primeiro voto 201; segundo no mesmo par → 409', async () => {
    const create = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCandidate('T5.1', { votingOpen: true }))
      .expect(201);
    const id = (create.body as { id: string }).id;

    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: publicScores() })
      .expect(201);

    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: publicScores() })
      .expect(409);

    await request(server)
      .delete(`/api/v1/candidates/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });
});
