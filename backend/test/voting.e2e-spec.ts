import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureNestWs } from './configure-nest-ws';
import { UserRole } from '../src/common/user-role.enum';
import { User } from '../src/entities/user.entity';
import { JUDGE_VOTE_CRITERIA } from '../src/voting/voting.constants';

const describeOrSkip = process.env.DATABASE_URL ? describe : describe.skip;

const publicScores = () => ({
  entertainment: 8,
  emotion: 7,
  likedTheMusic: 9,
  wouldListenAgain: 8,
});

const judgeScores = () => ({
  vocalTechnique: 8,
  interpretation: 7,
  stagePresence: 6,
  originality: 9,
  composition: 8,
});

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

    const ds = app.get(DataSource);

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

  it('T5.2 — PUBLIC com critérios de jurado → 400', async () => {
    const create = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCandidate('T5.2', { votingOpen: true }))
      .expect(201);
    const id = (create.body as { id: string }).id;

    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: judgeScores() })
      .expect(400);

    await request(server)
      .delete(`/api/v1/candidates/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });

  it('T5.3 — JUDGE com 4 critérios → 400', async () => {
    const create = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCandidate('T5.3', { votingOpen: true }))
      .expect(201);
    const id = (create.body as { id: string }).id;

    const four: Record<string, number> = {};
    for (const k of JUDGE_VOTE_CRITERIA.slice(0, 4)) {
      four[k] = 7;
    }

    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${judgeToken}`)
      .send({ criteriaScores: four })
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

    const badLow = { ...publicScores(), entertainment: 0 };
    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: badLow })
      .expect(400);

    const badHigh = { ...publicScores(), emotion: 11 };
    await request(server)
      .post(`/api/v1/candidates/${id}/votes`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ criteriaScores: badHigh })
      .expect(400);

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
