import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureNestWs } from './configure-nest-ws';
import { UserRole } from '../src/common/user-role.enum';
import { User } from '../src/entities/user.entity';

const describeOrSkip = process.env.DATABASE_URL ? describe : describe.skip;

describeOrSkip('Users / auth (e2e) — Fase 2 (T2.2, T2.3)', () => {
  let app: INestApplication<App>;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let publicUserEmail: string;
  let publicUserId: string;
  const adminEmail =
    process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@voxscore.local';
  let adminToken: string;

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
    server = app.getHttpServer();

    const ds = app.get(DataSource);
    publicUserEmail = `public-e2e-${Date.now()}@voxscore.test`;
    const saved = await ds.getRepository(User).save({
      email: publicUserEmail,
      displayName: 'Public E2E',
      photoUrl: null,
      role: UserRole.PUBLIC,
      disabled: false,
    });
    publicUserId = saved.id;

    const ta = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: adminEmail })
      .expect(200);
    adminToken = (ta.body as { accessToken: string }).accessToken;
  });

  it('T2.3 — GET /users/me sem Authorization retorna 401', () => {
    return request(server).get('/api/v1/users/me').expect(401);
  });

  it('T2.2 — com JWT de PUBLIC, GET /users/me retorna role PUBLIC', async () => {
    const tokenRes = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: publicUserEmail })
      .expect(200);

    const accessToken = (tokenRes.body as { accessToken?: string }).accessToken;
    expect(accessToken).toBeDefined();

    const me = await request(server)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = me.body as { role?: string; email?: string };
    expect(body.role).toBe(UserRole.PUBLIC);
    expect(body.email).toBe(publicUserEmail);
  });

  it('GET /users sem ADMIN → 403', async () => {
    const tokenRes = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: publicUserEmail })
      .expect(200);
    const publicToken = (tokenRes.body as { accessToken: string }).accessToken;
    await request(server)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${publicToken}`)
      .expect(403);
  });

  it('GET /users como ADMIN → 200 e lista', async () => {
    const res = await request(server)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const arr = res.body as { email: string }[];
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.some((u) => u.email === publicUserEmail)).toBe(true);
  });

  it('PATCH /users/:id como PUBLIC → 403', async () => {
    const tokenRes = await request(server)
      .post('/api/v1/auth/dev/token')
      .send({ email: publicUserEmail })
      .expect(200);
    const publicToken = (tokenRes.body as { accessToken: string }).accessToken;
    await request(server)
      .patch(`/api/v1/users/${publicUserId}`)
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ role: UserRole.JUDGE })
      .expect(403);
  });

  it('PATCH utilizador para JUDGE (ADMIN) → 200', async () => {
    await request(server)
      .patch(`/api/v1/users/${publicUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: UserRole.JUDGE })
      .expect(200);
    const row = await app.get(DataSource).getRepository(User).findOne({
      where: { id: publicUserId },
    });
    expect(row?.role).toBe(UserRole.JUDGE);
  });

  it('último ADMIN não pode ser despromovido → 403', async () => {
    const me = await request(server)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const adminId = (me.body as { id: string }).id;
    await request(server)
      .patch(`/api/v1/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: UserRole.PUBLIC })
      .expect(403);
  });

  afterAll(async () => {
    await app.close();
  });
});
