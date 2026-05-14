import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureNestWs } from './configure-nest-ws';
import { UserRole } from '../src/common/user-role.enum';
import { User } from '../src/entities/user.entity';

const describeOrSkip = process.env.DATABASE_URL ? describe : describe.skip;

function validCandidate(suffix: string) {
  return {
    name: `Artist ${suffix}`,
    musicTitle: 'Song',
    genre: 'Pop',
    bio: 'Biography text.',
    photoUrl: 'https://example.com/photo.jpg',
    instagramUrl: null as string | null,
    youtubeUrl: null as string | null,
    votingOpen: false,
    displayOrder: 0,
    active: true,
  };
}

describeOrSkip('Candidates (e2e) — Fase 4 (T4.1–T4.5)', () => {
  let app: INestApplication;
  let server: Server;
  let publicToken: string;
  let adminToken: string;
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
    const publicEmail = `cand-pub-${Date.now()}@voxscore.test`;
    await ds.getRepository(User).save({
      email: publicEmail,
      displayName: 'Public Candidate Tester',
      role: UserRole.PUBLIC,
      disabled: false,
      photoUrl: null,
    });

    const pubRes = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: publicEmail })
      .expect(200);
    publicToken = (pubRes.body as { accessToken: string }).accessToken;

    const admRes = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: adminEmail })
      .expect(200);
    adminToken = (admRes.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('T4.2 — PUBLIC: POST /candidates → 403', () => {
    return request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${publicToken}`)
      .send(validCandidate('forbidden'))
      .expect(403);
  });

  it('T4.5 — ADMIN: POST corpo inválido (photoUrl) → 400', () => {
    return request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validCandidate('bad'),
        photoUrl: 'not-a-valid-url',
      })
      .expect(400);
  });

  let createdId: string;

  it('T4.3 — ADMIN: cria candidato; GET por id devolve payload completo', async () => {
    const createRes = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCandidate('t43'))
      .expect(201);

    const body = createRes.body as { id: string; name: string };
    createdId = body.id;
    expect(body.name).toContain('Artist');

    const getRes = await request(server)
      .get(`/api/v1/candidates/${createdId}`)
      .set('Authorization', `Bearer ${publicToken}`)
      .expect(200);

    const got = getRes.body as { id: string; musicTitle: string };
    expect(got.id).toBe(createdId);
    expect(got.musicTitle).toBe('Song');
  });

  it('T4.1 — PUBLIC: GET /candidates 200 e só candidatos ativos', async () => {
    const inactiveRes = await request(server)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validCandidate('inactive'), active: false })
      .expect(201);
    const inactiveId = (inactiveRes.body as { id: string }).id;

    const listRes = await request(server)
      .get('/api/v1/candidates')
      .set('Authorization', `Bearer ${publicToken}`)
      .expect(200);

    const list = listRes.body as { id: string; active: boolean }[];
    expect(Array.isArray(list)).toBe(true);
    const ids = list.map((c) => c.id);
    expect(ids).toContain(createdId);
    expect(ids).not.toContain(inactiveId);
    for (const c of list) {
      expect(c.active).toBe(true);
    }

    await request(server)
      .delete(`/api/v1/candidates/${inactiveId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });

  it('T4.4 — ADMIN: atualiza votingOpen; valor persiste', async () => {
    await request(server)
      .patch(`/api/v1/candidates/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ votingOpen: true })
      .expect(200);

    const getRes = await request(server)
      .get(`/api/v1/candidates/${createdId}`)
      .set('Authorization', `Bearer ${publicToken}`)
      .expect(200);

    expect((getRes.body as { votingOpen: boolean }).votingOpen).toBe(true);
  });
});
